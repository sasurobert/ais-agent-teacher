import { PrismaClient } from '@prisma/client';

export class ProgressReportService {
    private prisma: PrismaClient;

    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
    }

    /**
     * Generates a comprehensive progress report for a teacher's class.
     */
    async generateClassReport(teacherDid: string, classId: string) {
        const classInfo = await (this.prisma as any).classAnalytics.findFirst({
            where: { id: classId, teacherDid }
        });

        if (!classInfo) {
            throw new Error(`Class ${classId} not found for teacher ${teacherDid}`);
        }

        // Aggregate alerts and student data
        const alerts = await (this.prisma as any).studentAlert.findMany({
            where: { teacherDid, resolved: false },
        });

        console.log(`[ProgressReportService] Found ${alerts.length} alerts for teacher ${teacherDid}`);
        if (alerts.length > 0) {
            console.log(`[ProgressReportService] Sample alert:`, JSON.stringify(alerts[0]));
            console.log(`[ProgressReportService] Sample alert keys:`, Object.keys(alerts[0]));
        }

        const report = `
# Progress Report: ${classInfo.className}
Generated on: ${new Date().toLocaleDateString()}

## Class Overview
${classInfo.summary || 'No summary available.'}

## Active Alerts (${alerts.length})
${alerts.map((a: any) => `- ALERT: ${a.type || 'MISSING_TYPE'} [${a.severity}] ${a.studentDid}: ${a.message}`).join('\n')}

## Pedagogical Recommendations
- Reinforce **Fractions** foundations for the flagged students.
- Introduce **Biblical Resilience** stories (Job, Nehemiah) to students with low grit scores.
        `;

        return report;
    }
}
