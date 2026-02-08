import { StateGraph, END, START } from "@langchain/langgraph";
import { BaseMessage, HumanMessage, AIMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import { BibleAnalogyService } from "../services/BibleAnalogyService.js";

export interface TeacherState {
    messages: BaseMessage[];
    teacherDid: string;
    classContext: any;
    analogy?: any;
}

export class TeacherAgent {
    private graph: any;
    private llm: ChatOpenAI;
    private analogyService: BibleAnalogyService;

    constructor() {
        this.llm = new ChatOpenAI({ modelName: "gpt-4o", streaming: true });
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
                }
            }
        } as any);

        workflow.addNode("agent", this.callModel.bind(this));
        workflow.addNode("getAnalogy", this.fetchAnalogy.bind(this));

        workflow.addEdge(START, "getAnalogy" as any);
        workflow.addEdge("getAnalogy" as any, "agent" as any);
        workflow.addEdge("agent" as any, END as any);

        this.graph = workflow.compile();
    }

    private async fetchAnalogy(state: TeacherState) {
        const lastMessage = state.messages[state.messages.length - 1];
        const topic = (lastMessage?.content as string) || "general";
        const analogy = await this.analogyService.getAnalogy(topic);
        return { analogy };
    }

    private async callModel(state: TeacherState) {
        const systemPrompt = `You are the Teacher Personal Assistant, an efficiency-first companion for educators.
Unlike the student tutor, your goal is to be DIRECT, CONCISE, and OPERATIONAL.
Provide drafts, summaries, and insights immediately.

CLASS CONTEXT:
${JSON.stringify(state.classContext)}

TASK: Help the teacher manage their classroom and student progress.`;

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
