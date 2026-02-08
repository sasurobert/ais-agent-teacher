import express, { type Request, type Response } from 'express';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

import { TeacherAgent } from './agents/TeacherAgent.js';
import { AnalyticsService } from './services/AnalyticsService.js';
import { AlertService } from './services/AlertService.js';
import { ProgressReportService } from './services/ProgressReportService.js';
import { HumanMessage } from '@langchain/core/messages';

dotenv.config();

const app = express();
app.use(express.json());

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

const teacherAgent = new TeacherAgent();
const analytics = new AnalyticsService(prisma);
const alerts = new AlertService(prisma);
const reportService = new ProgressReportService(prisma);

const port = process.env.PORT || 3007;

app.get('/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', service: 'ais-agent-teacher' });
});

app.post('/reports/generate', async (req: Request, res: Response) => {
    const { teacherDid, classId } = req.body;
    try {
        const report = await reportService.generateClassReport(teacherDid, classId);
        res.json({ report });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/chat', async (req: Request, res: Response) => {
    const { message, teacherDid, context } = req.body;
    try {
        const result = await teacherAgent.run(teacherDid, [new HumanMessage(message)], context);
        res.json({ response: result.messages[result.messages.length - 1].content });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/analytics/:teacherDid', async (req: Request, res: Response) => {
    const teacherDid = req.params.teacherDid as string;
    const data = await analytics.getClassHealth(teacherDid);
    res.json(data);
});

app.post('/events/telemetry', async (req: Request, res: Response) => {
    const { studentDid, teacherDid, state } = req.body;
    await alerts.checkStudentAlerts(studentDid, teacherDid, state);
    res.json({ processed: true });
});

app.listen(port, () => {
    console.log(`Teacher Agent Service listening on port ${port}`);
});
