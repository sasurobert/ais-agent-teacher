import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnalyticsService } from '../services/AnalyticsService.js';
import { AlertService } from '../services/AlertService.js';

const mockPrisma = {
    studentAlert: {
        findMany: vi.fn().mockResolvedValue([]),
        create: vi.fn().mockResolvedValue({}),
    },
    classAnalytics: {
        findMany: vi.fn().mockResolvedValue([{ className: 'Math 101' }]),
    },
    $queryRaw: vi.fn().mockResolvedValue([])
};

describe('Analytical Services', () => {
    let analytics: AnalyticsService;
    let alerts: AlertService;

    beforeEach(() => {
        analytics = new AnalyticsService(mockPrisma as any);
        alerts = new AlertService(mockPrisma as any);
    });

    it('should fetch class health data', async () => {
        const health = await analytics.getClassHealth('teacher-456');
        expect(health.classes).toHaveLength(1);
        expect(health.totalAlerts).toBe(0);
    });

    it('should generate alerts for help abuse', async () => {
        const studentState = { helpClickCount: 6, gritScore: 0.8 };
        await alerts.checkStudentAlerts('student-123', 'teacher-456', studentState);
        expect(mockPrisma.studentAlert.create).toHaveBeenCalledWith(expect.objectContaining({
            data: expect.objectContaining({ type: 'HELP_ABUSE' })
        }));
    });
});
