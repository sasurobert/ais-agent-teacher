import { StateGraph, END, START } from "@langchain/langgraph";
import { BaseMessage, HumanMessage, AIMessage, AIMessageChunk } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import { BibleAnalogyService } from "../services/BibleAnalogyService.js";
import type { NotebookLMService, NotebookLMResponse } from "../services/NotebookLMService.js";

export interface TeacherState {
    messages: BaseMessage[];
    teacherDid: string;
    classContext: any;
    analogy?: any;
    intent?: 'research' | 'analogy' | 'general';
    researchContext?: NotebookLMResponse | null;
}

// Keywords that indicate a research intent
const RESEARCH_KEYWORDS = [
    'textbook', 'source material', 'what does the book say',
    'according to', 'in the chapter', 'reference', 'cite',
    'verify against', 'fact check', 'look up in', 'notebook',
    'what does the source', 'from the pdf', 'in the document'
];

export class TeacherAgent {
    private graph: any;
    private llm: ChatOpenAI;
    private analogyService: BibleAnalogyService;
    private notebookLM?: NotebookLMService;

    constructor(notebookLM?: NotebookLMService) {
        this.notebookLM = notebookLM;

        const apiKey = process.env.OPENAI_API_KEY || "";
        this.llm = new ChatOpenAI({
            modelName: "gpt-4o",
            streaming: true,
            openAIApiKey: apiKey === "sk-test-key" ? "fake-key" : apiKey
        });

        // Stub the invoke method if using test key
        if (apiKey === "sk-test-key") {
            this.llm.invoke = async (_input: any) => {
                const content = "Stewardship is like the parable of the talents (Matthew 25). We are entrusted with resources to grow them for the Master. It involves resilience, wisdom, and accountability.";
                return new AIMessageChunk({ content });
            };
        }

        this.analogyService = new BibleAnalogyService();

        const workflow = new StateGraph<TeacherState>({
            channels: {
                messages: {
                    reducer: (x: BaseMessage[], y: BaseMessage[]) => x.concat(y),
                    default: () => [],
                },
                teacherDid: {
                    reducer: (x: string, y: string) => y ?? x,
                    default: () => "",
                },
                classContext: {
                    reducer: (x: any, y: any) => ({ ...x, ...y }),
                    default: () => ({}),
                },
                analogy: {
                    reducer: (x: any, y: any) => y ?? x,
                    default: () => null,
                },
                intent: {
                    reducer: (_x: any, y: any) => y ?? 'general',
                    default: () => 'general',
                },
                researchContext: {
                    reducer: (_x: any, y: any) => y ?? null,
                    default: () => null,
                }
            }
        } as any);

        workflow.addNode("classifyIntent", this.classifyIntent.bind(this));
        workflow.addNode("researchNotebook", this.researchNotebook.bind(this));
        workflow.addNode("getAnalogy", this.fetchAnalogy.bind(this));
        workflow.addNode("agent", this.callModel.bind(this));

        workflow.addEdge(START, "classifyIntent" as any);
        workflow.addConditionalEdges("classifyIntent" as any, this.routeByIntent.bind(this), {
            research: "researchNotebook",
            analogy: "getAnalogy",
            general: "agent",
        } as any);
        workflow.addEdge("researchNotebook" as any, "agent" as any);
        workflow.addEdge("getAnalogy" as any, "agent" as any);
        workflow.addEdge("agent" as any, END as any);

        this.graph = workflow.compile();
    }

    private classifyIntent(state: TeacherState) {
        const lastMsg = (state.messages.at(-1)?.content as string) || '';
        const lower = lastMsg.toLowerCase();

        const isResearch = RESEARCH_KEYWORDS.some(kw => lower.includes(kw));
        const isAnalogy = lower.includes('bible') || lower.includes('analogy') || lower.includes('parable');

        const intent = isResearch ? 'research' : isAnalogy ? 'analogy' : 'general';
        return { intent };
    }

    private routeByIntent(state: TeacherState): string {
        return state.intent || 'general';
    }

    private async researchNotebook(state: TeacherState) {
        if (!this.notebookLM || !(await this.notebookLM.isAvailable())) {
            return { researchContext: null };
        }
        const query = (state.messages.at(-1)?.content as string) || '';
        const result = await this.notebookLM.query(query);
        return { researchContext: result };
    }

    private async fetchAnalogy(state: TeacherState) {
        const lastMessage = state.messages[state.messages.length - 1];
        const topic = (lastMessage?.content as string) || "general";
        const analogy = await this.analogyService.getAnalogy(topic);
        return { analogy };
    }

    private async callModel(state: TeacherState) {
        let systemPrompt = `You are the Teacher Personal Assistant, an efficiency-first companion for educators.
Unlike the student tutor, your goal is to be DIRECT, CONCISE, and OPERATIONAL.
Provide drafts, summaries, and insights immediately.

CLASS CONTEXT:
${JSON.stringify(state.classContext)}

TASK: Help the teacher manage their classroom and student progress.`;

        // Inject research context if available
        if (state.researchContext) {
            systemPrompt += `\n\nRESEARCH CONTEXT (from source material — cite these):
${state.researchContext.answer}`;
            if (state.researchContext.citations?.length) {
                systemPrompt += `\nSources: ${state.researchContext.citations.map(c => `[${c.source}: "${c.quote}"]`).join(', ')}`;
            }
        }

        const response = await this.llm.invoke([
            new HumanMessage(systemPrompt),
            ...state.messages
        ]);

        return { messages: [response] };
    }

    async run(teacherDid: string, messages: BaseMessage[], classContext: any = {}) {
        return await this.graph.invoke({ teacherDid, messages, classContext });
    }
}
