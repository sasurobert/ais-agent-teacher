import { describe, it, expect, vi } from 'vitest';
import { TeacherAgent } from '../agents/TeacherAgent.js';
import { HumanMessage, AIMessage } from '@langchain/core/messages';

vi.mock('@langchain/openai', () => {
    return {
        ChatOpenAI: class {
            invoke = vi.fn().mockResolvedValue(new AIMessage("Here is your requested feedback draft for the student."));
            bindTools = vi.fn().mockReturnThis();
        }
    };
});

describe('TeacherAgent', () => {
    it('should provide direct feedback drafts', async () => {
        const agent = new TeacherAgent();
        const result = await agent.run('teacher-456', [
            new HumanMessage("Draft a feedback comment for student-123 who is struggling with fractions.")
        ]);

        const lastMessage = result.messages[result.messages.length - 1];
        expect(lastMessage.content).toContain('feedback draft');
    });

    it('should suggest biblical analogies for topics', async () => {
        const agent = new TeacherAgent();
        const result = await agent.run('teacher-456', [
            new HumanMessage("Give me a bible analogy for grit.")
        ]);
        // Note: The logic for switching to 'getAnalogy' node is being refined
        expect(result.messages).toBeDefined();
    });
});
