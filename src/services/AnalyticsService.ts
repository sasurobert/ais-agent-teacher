import { PrismaClient } from '@prisma/client';

export class AnalyticsService {
    private prisma: PrismaClient;

    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
    }

    /**
     * Aggregates student data from the database.
     * In a real system, this might join with the 'ais-agent-tutor' DB or use a central data lake.
     */
    async getClassHealth(teacherDid: string) {
        console.log(`[AnalyticsService] Fetching health for teacher: ${teacherDid}`);
        try {
            // Raw query test
            const rawTest = await (this.prisma as any).$queryRaw`SELECT tablename FROM pg_tables WHERE schemaname = 'teacher'`;
            console.log(`[AnalyticsService] Raw tables in teacher schema:`, rawTest);

            const currentSchema = await (this.prisma as any).$queryRaw`SELECT current_schema()`;
            console.log(`[AnalyticsService] Current schema:`, currentSchema);

            const alerts = await (this.prisma as any).studentAlert.findMany({
                where: { teacherDid, resolved: false },
            });

            const activeClasses = await (this.prisma as any).classAnalytics.findMany({
                where: { teacherDid },
            });

            return {
                totalAlerts: alerts.length,
                alerts: alerts.slice(0, 5), // Latest 5 alerts
                classes: activeClasses
            };
        } catch (error: any) {
            console.error(`[AnalyticsService] Error in getClassHealth:`, error);
            throw error;
        }
    }

    /**
     * Drafts a summary of a student's progress.
     */
    async getStudentSnapshot(studentDid: string) {
        // Mocking retrieval of student state
        return {
            studentDid,
            status: 'STRUGGLING',
            recentQuest: 'Fractions II',
            gritScore: 0.65,
            helpClickCount: 6 // Triggering abuse alert
        };
    }
}
