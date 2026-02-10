import { describe, it, expect } from 'vitest';
import { PlaybookCopilotService } from '../services/playbook-copilot.js';

describe('PlaybookCopilotService — Research Tips', () => {
    const copilot = new PlaybookCopilotService();

    // PC-01
    it('getResearchTips(true) returns only research-textbook tip', () => {
        const tips = copilot.getResearchTips(true);
        expect(tips).toHaveLength(1);
        expect(tips[0].id).toBe('research-textbook');
    });

    // PC-02
    it('getResearchTips(false) returns both research-textbook + research-setup', () => {
        const tips = copilot.getResearchTips(false);
        expect(tips).toHaveLength(2);
        expect(tips.map(t => t.id)).toEqual(['research-textbook', 'research-setup']);
    });

    // PC-03
    it('all research tips have category Research', () => {
        const tipsConnected = copilot.getResearchTips(true);
        const tipsDisconnected = copilot.getResearchTips(false);
        for (const tip of [...tipsConnected, ...tipsDisconnected]) {
            expect(tip.category).toBe('Research');
        }
    });

    // PC-04
    it('research tips have actionable: true', () => {
        const tips = copilot.getResearchTips(true);
        expect(tips[0].actionable).toBe(true);
    });
});
