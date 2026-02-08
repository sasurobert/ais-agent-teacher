import { PrismaClient } from '@prisma/client';

export class AlertService {
    private prisma: PrismaClient;

    constructor(prisma: PrismaClient) {
        this.prisma = prisma;
    }

    /**
     * Checks student state and generates alerts if thresholds are exceeded.
     */
    async checkStudentAlerts(studentDid: string, teacherDid: string, state: any) {
        if (state.helpClickCount >= 5) {
            console.log(`[AlertService] Creating HELP_ABUSE alert for ${studentDid}`);
            const alertData = {
                studentDid,
                teacherDid,
                type: 'HELP_ABUSE',
                severity: 'HIGH',
                message: `Student ${studentDid} has clicked the help button ${state.helpClickCount} times without quest progression.`
            };
            try {
                const newAlert = await (this.prisma as any).studentAlert.create({
                    data: alertData
                });
                console.log(`[AlertService] Alert created in DB:`, JSON.stringify(newAlert));
            } catch (err: any) {
                console.error(`[AlertService] Failed to create alert:`, err.message);
            }
        }

        if (state.gritScore < 0.5) {
            await (this.prisma as any).studentAlert.create({
                data: {
                    studentDid,
                    teacherDid,
                    type: 'STRUGGLE',
                    severity: 'MEDIUM',
                    message: `Student ${studentDid} is showing low grit scores in recent activities.`
                }
            });
        }
    }
}
