import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import playbookRoutes from './routes/playbook.routes.js';

const app = express();
app.use(express.json());
app.use('/playbook', playbookRoutes);

describe('Playbook API Integration', () => {
    it('GET /playbook/templates should list all templates', async () => {
        const res = await request(app).get('/playbook/templates');
        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(7);
        expect(res.body[0]).toHaveProperty('type');
        expect(res.body[0]).toHaveProperty('name');
    });

    it('GET /playbook/templates/AssessmentSuite should return correct template', async () => {
        const res = await request(app).get('/playbook/templates/AssessmentSuite');
        expect(res.status).toBe(200);
        expect(res.body.type).toBe('AssessmentSuite');
        expect(res.body.aiFillableFields).toContain('bossBattle');
    });

    it('GET /playbook/tips/ingestion should return PDF tips', async () => {
        const res = await request(app).get('/playbook/tips/ingestion?sourceType=PDF');
        expect(res.status).toBe(200);
        const tips = res.body;
        expect(tips).toBeInstanceOf(Array);
        const pdfTip = tips.find((t: any) => t.id === 'ingest-quality');
        expect(pdfTip).toBeDefined();
        expect(pdfTip.content).toContain('OCR errors');
    });

    it('GET /playbook/tips/review should return grade-level advice', async () => {
        const res = await request(app).get('/playbook/tips/review?gradeLevel=4');
        expect(res.status).toBe(200);
        const tips = res.body;
        const voiceTip = tips.find((t: any) => t.id === 'review-voice');
        expect(voiceTip).toBeDefined(); // Should exist for grade < 6
    });

    it('GET /playbook/tips/assessment should return Boss Battle guidance', async () => {
        const res = await request(app).get('/playbook/tips/assessment?type=BossBattle');
        expect(res.status).toBe(200);
        const tips = res.body;
        const summativeTip = tips.find((t: any) => t.id === 'assess-boss-summative');
        expect(summativeTip).toBeDefined();
        expect(summativeTip.priority).toBe('High');
    });
});
