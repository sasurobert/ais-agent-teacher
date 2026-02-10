import { Router, type Request, type Response } from 'express';
import type { NotebookLMService } from '../services/NotebookLMService.js';
import type { NotebookSharingService } from '../services/NotebookSharingService.js';

export function createResearchRouter(
    notebookLM: NotebookLMService,
    sharing: NotebookSharingService
): Router {
    const router = Router();

    // Research: Ask a question
    router.post('/ask', async (req: Request, res: Response) => {
        const { question, notebookId, teacherDid } = req.body;
        if (!question) {
            res.status(400).json({ error: 'question is required' });
            return;
        }

        // Auth check if notebookId is specified
        if (notebookId && teacherDid) {
            const canAccess = await sharing.canAccess(notebookId, teacherDid);
            if (!canAccess) {
                res.status(403).json({ error: 'No access to this notebook' });
                return;
            }
        }

        const result = await notebookLM.query(question, notebookId);
        res.json(result);
    });

    // Verify SCDS content against source
    router.post('/verify', async (req: Request, res: Response) => {
        const { content, notebookId } = req.body;
        if (!content || !notebookId) {
            res.status(400).json({ error: 'content and notebookId required' });
            return;
        }

        const result = await notebookLM.verifyContent(content, notebookId);
        res.json(result);
    });

    // List notebooks (owned + shared)
    router.get('/notebooks', async (req: Request, res: Response) => {
        const teacherDid = req.query.teacherDid as string;
        if (!teacherDid) {
            res.status(400).json({ error: 'teacherDid required' });
            return;
        }

        const owned = await sharing.findByOwner(teacherDid);
        const shared = await sharing.findSharedWith(teacherDid);
        res.json({ owned, shared });
    });

    // Register a notebook (auto-create on PDF upload)
    router.post('/notebooks', async (req: Request, res: Response) => {
        const { url, title, subject, ownerDid, gradeLevel } = req.body;
        if (!url || !title || !ownerDid) {
            res.status(400).json({ error: 'url, title, ownerDid required' });
            return;
        }

        // Create in MCP
        const notebooklmId = await notebookLM.createFromUpload(url, {
            name: title,
            subject,
            description: `${title} - ${subject || 'General'}`,
        });

        // Persist in DB
        const notebook = await sharing.register({
            notebooklmId,
            notebooklmUrl: url,
            title,
            subject,
            gradeLevel,
            ownerDid,
        });

        res.status(201).json(notebook);
    });

    // Share a notebook
    router.post('/notebooks/:id/share', async (req: Request, res: Response) => {
        const id = req.params.id as string;
        const { targetDid, role, sharedByDid } = req.body;
        if (!targetDid || !sharedByDid) {
            res.status(400).json({ error: 'targetDid, sharedByDid required' });
            return;
        }

        const level = await sharing.getAccessLevel(id, sharedByDid as string);
        if (level !== 'owner') {
            res.status(403).json({ error: 'Only owner can share' });
            return;
        }

        await sharing.share(id, targetDid, role || 'reader', sharedByDid);
        res.json({ shared: true });
    });

    // Unshare
    router.delete('/notebooks/:id/share/:did', async (req: Request, res: Response) => {
        const id = req.params.id as string;
        const did = req.params.did as string;
        await sharing.unshare(id, did);
        res.json({ unshared: true });
    });

    // Student query endpoint (rate-limited, goes through Agent Shield)
    router.post('/student/ask', async (req: Request, res: Response) => {
        const { question, notebookId, studentDid } = req.body;
        if (!question || !notebookId || !studentDid) {
            res.status(400).json({ error: 'question, notebookId, studentDid required' });
            return;
        }

        const canAccess = await sharing.canAccess(notebookId, studentDid);
        if (!canAccess) {
            res.status(403).json({ error: 'No access to this notebook' });
            return;
        }

        const result = await notebookLM.query(question, notebookId);
        res.json(result);
    });

    return router;
}
