import { describe, it, expect, vi } from 'vitest';
import { TeacherAgent } from '../agents/TeacherAgent.js';
import { HumanMessage, AIMessage, AIMessageChunk } from '@langchain/core/messages';
import type { NotebookLMService } from '../services/NotebookLMService.js';

vi.mock('@langchain/openai', () => {
    return {
        ChatOpenAI: class {
            invoke = vi.fn().mockResolvedValue(new AIMessageChunk({
                content: 'Here is your response based on the source material.'
            }));
            bindTools = vi.fn().mockReturnThis();
        }
    };
});

const mockNotebookLM = {
    isAvailable: vi.fn().mockResolvedValue(true),
    query: vi.fn().mockResolvedValue({
        answer: 'Improper fractions have numerator > denominator',
        citations: [{ source: 'Prealgebra2e', quote: 'p.247' }],
        confidence: 'high',
    }),
} as unknown as NotebookLMService;

const mockUnavailableNotebookLM = {
    isAvailable: vi.fn().mockResolvedValue(false),
    query: vi.fn(),
} as unknown as NotebookLMService;

describe('TeacherAgent — Intent Routing', () => {

    // TA-03: Research keyword triggers research intent
    it('should classify "textbook" as research intent', async () => {
        const agent = new TeacherAgent(mockNotebookLM);
        const result = await agent.run('teacher-1', [
            new HumanMessage('What does the textbook say about improper fractions?')
        ]);
        expect(result.messages.length).toBeGreaterThan(0);
        // The mock NotebookLM query should have been called
        expect(mockNotebookLM.query).toHaveBeenCalled();
    });

    // TA-04: "according to the chapter" triggers research
    it('should classify "according to" as research intent', async () => {
        const agent = new TeacherAgent(mockNotebookLM);
        vi.mocked(mockNotebookLM.query).mockClear();
        await agent.run('teacher-1', [
            new HumanMessage('According to the chapter, what are mixed numbers?')
        ]);
        expect(mockNotebookLM.query).toHaveBeenCalled();
    });

    // TA-05: "bible analogy" triggers analogy intent
    it('should classify "bible" as analogy intent', async () => {
        const agent = new TeacherAgent(mockNotebookLM);
        vi.mocked(mockNotebookLM.query).mockClear();
        const result = await agent.run('teacher-1', [
            new HumanMessage('Give me a bible analogy for stewardship')
        ]);
        // Bible route: should not call NLM query (goes through analogy path)
        expect(mockNotebookLM.query).not.toHaveBeenCalled();
        expect(result.messages.length).toBeGreaterThan(0);
    });

    // TA-06: General message without keywords triggers general
    it('should classify general message as general intent', async () => {
        const agent = new TeacherAgent(mockNotebookLM);
        vi.mocked(mockNotebookLM.query).mockClear();
        const result = await agent.run('teacher-1', [
            new HumanMessage('Generate a quiz for lesson 5')
        ]);
        // General route: should not call NLM query
        expect(mockNotebookLM.query).not.toHaveBeenCalled();
        expect(result.messages.length).toBeGreaterThan(0);
    });

    // TA-07: Research with no NLM service → researchContext null
    it('should handle research intent with no NotebookLM service', async () => {
        const agentNoNLM = new TeacherAgent(); // no NLM passed
        const result = await agentNoNLM.run('teacher-1', [
            new HumanMessage('What does the textbook say about fractions?')
        ]);
        // Should still produce a response, just without NLM context
        expect(result.messages.length).toBeGreaterThan(0);
    });

    // TA-08: Research with unavailable NLM → graceful fallback
    it('should handle research intent with unavailable NotebookLM', async () => {
        const agent = new TeacherAgent(mockUnavailableNotebookLM);
        const result = await agent.run('teacher-1', [
            new HumanMessage('What does the textbook say about fractions?')
        ]);
        expect(result.messages.length).toBeGreaterThan(0);
        // Should not have called query since NLM is unavailable
        expect(mockUnavailableNotebookLM.query).not.toHaveBeenCalled();
    });
});
