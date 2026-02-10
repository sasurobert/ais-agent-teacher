import { describe, it, expect, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createResearchRouter } from '../routes/research.routes.js';
import type { NotebookLMService } from '../services/NotebookLMService.js';
import type { NotebookSharingService } from '../services/NotebookSharingService.js';

// Mock services
const mockNotebookLM = {
    query: vi.fn().mockResolvedValue({
        answer: 'Fractions represent parts of a whole',
        citations: [{ source: 'Prealgebra2e', quote: 'p.247' }],
        confidence: 'high',
    }),
    createFromUpload: vi.fn().mockResolvedValue('nb-123'),
    verifyContent: vi.fn().mockResolvedValue({
        grounded: true, answer: 'Verified', citations: []
    }),
} as unknown as NotebookLMService;

const mockSharing = {
    findByOwner: vi.fn().mockResolvedValue([{ id: '1', title: 'Math' }]),
    findSharedWith: vi.fn().mockResolvedValue([]),
    register: vi.fn().mockResolvedValue({ id: 'nb-1', title: 'Prealgebra' }),
    share: vi.fn(),
    unshare: vi.fn(),
    canAccess: vi.fn().mockResolvedValue(true),
    getAccessLevel: vi.fn().mockResolvedValue('owner'),
} as unknown as NotebookSharingService;

const app = express();
app.use(express.json());
app.use('/research', createResearchRouter(mockNotebookLM, mockSharing));

describe('Research Routes - Integration', () => {
    it('POST /research/ask — queries NotebookLM', async () => {
        const res = await request(app)
            .post('/research/ask')
            .send({ question: 'What are fractions?', teacherDid: 't1' });

        expect(res.status).toBe(200);
        expect(res.body.answer).toContain('Fractions');
        expect(res.body.citations).toHaveLength(1);
    });

    it('POST /research/ask — rejects missing question', async () => {
        const res = await request(app).post('/research/ask').send({});
        expect(res.status).toBe(400);
    });

    it('POST /research/ask — denies access to unauthorized notebook', async () => {
        vi.mocked(mockSharing.canAccess).mockResolvedValueOnce(false);
        const res = await request(app)
            .post('/research/ask')
            .send({ question: 'test', notebookId: 'nb-1', teacherDid: 't-bad' });

        expect(res.status).toBe(403);
    });

    it('POST /research/notebooks — creates notebook', async () => {
        const res = await request(app)
            .post('/research/notebooks')
            .send({ url: 'https://notebooklm.google.com/nb/abc', title: 'Prealgebra', ownerDid: 't1' });

        expect(res.status).toBe(201);
        expect(mockNotebookLM.createFromUpload).toHaveBeenCalled();
        expect(mockSharing.register).toHaveBeenCalled();
    });

    it('POST /research/notebooks — rejects missing fields', async () => {
        const res = await request(app)
            .post('/research/notebooks')
            .send({ url: 'test' }); // missing title, ownerDid

        expect(res.status).toBe(400);
    });

    it('GET /research/notebooks — lists owned + shared', async () => {
        const res = await request(app)
            .get('/research/notebooks?teacherDid=t1');

        expect(res.status).toBe(200);
        expect(res.body.owned).toHaveLength(1);
        expect(res.body.shared).toHaveLength(0);
    });

    it('GET /research/notebooks — rejects missing teacherDid', async () => {
        const res = await request(app).get('/research/notebooks');
        expect(res.status).toBe(400);
    });

    it('POST /research/notebooks/:id/share — shares notebook', async () => {
        vi.mocked(mockSharing.getAccessLevel).mockResolvedValueOnce('owner');
        const res = await request(app)
            .post('/research/notebooks/nb-1/share')
            .send({ targetDid: 't2', sharedByDid: 't1' });

        expect(res.status).toBe(200);
        expect(res.body.shared).toBe(true);
    });

    it('POST /research/notebooks/:id/share — rejects non-owner', async () => {
        vi.mocked(mockSharing.getAccessLevel).mockResolvedValueOnce('reader');
        const res = await request(app)
            .post('/research/notebooks/nb-1/share')
            .send({ targetDid: 't2', sharedByDid: 't3' });

        expect(res.status).toBe(403);
    });

    it('POST /research/verify — fact-checks content', async () => {
        const res = await request(app)
            .post('/research/verify')
            .send({ content: 'Fractions are parts', notebookId: 'nb-1' });

        expect(res.status).toBe(200);
        expect(res.body.grounded).toBe(true);
    });

    it('POST /research/verify — rejects missing fields', async () => {
        const res = await request(app)
            .post('/research/verify')
            .send({ content: 'test' }); // missing notebookId

        expect(res.status).toBe(400);
    });

    it('POST /research/student/ask — student query with access check', async () => {
        vi.mocked(mockSharing.canAccess).mockResolvedValueOnce(true);
        const res = await request(app)
            .post('/research/student/ask')
            .send({ question: 'What is 3/4?', notebookId: 'nb-1', studentDid: 's1' });

        expect(res.status).toBe(200);
        expect(res.body.answer).toContain('Fractions');
    });

    it('POST /research/student/ask — denied without access', async () => {
        vi.mocked(mockSharing.canAccess).mockResolvedValueOnce(false);
        const res = await request(app)
            .post('/research/student/ask')
            .send({ question: 'test', notebookId: 'nb-1', studentDid: 's-bad' });

        expect(res.status).toBe(403);
    });

    it('POST /research/student/ask — rejects missing fields', async () => {
        const res = await request(app)
            .post('/research/student/ask')
            .send({ question: 'test' }); // missing notebookId, studentDid

        expect(res.status).toBe(400);
    });

    it('DELETE /research/notebooks/:id/share/:did — unshares', async () => {
        const res = await request(app)
            .delete('/research/notebooks/nb-1/share/t2');

        expect(res.status).toBe(200);
        expect(res.body.unshared).toBe(true);
        expect(mockSharing.unshare).toHaveBeenCalledWith('nb-1', 't2');
    });
});
