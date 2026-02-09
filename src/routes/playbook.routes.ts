import { Router } from 'express';
import { PlaybookTemplateService, type TemplateType } from '../services/playbook-templates.js';
import { PlaybookCopilotService } from '../services/playbook-copilot.js';

const router = Router();
const templateService = new PlaybookTemplateService();
const copilotService = new PlaybookCopilotService();

// TE-1: List all templates
router.get('/templates', (req, res) => {
    const templates = templateService.listTemplates();
    res.json(templates);
});

// TE-2: Get specific template details
router.get('/templates/:type', (req, res) => {
    const type = req.params.type as TemplateType;
    const template = templateService.getTemplate(type);

    if (!template) {
        return res.status(404).json({ error: 'Template not found' });
    }

    res.json({
        type: template.type,
        name: template.name,
        description: template.description,
        defaultContent: template.defaultContent,
        aiFillableFields: template.aiFillableFields
        // Schema is internal z object, not sending over wire directly
    });
});

// TE-3: Validate content against template
router.post('/templates/:type/validate', (req, res) => {
    const type = req.params.type as TemplateType;
    const content = req.body;

    const result = templateService.validateContent(type, content);

    if (!result.success) {
        return res.status(400).json({ valid: false, errors: result.errors });
    }

    res.json({ valid: true });
});

// CP-1: Get Ingestion Tips
router.get('/tips/ingestion', (req, res) => {
    const sourceType = (req.query.sourceType as 'PDF' | 'EPUB' | 'Web') || 'PDF';
    const tips = copilotService.getIngestionTips(sourceType);
    res.json(tips);
});

// CP-2: Get Review Checklist
router.get('/tips/review', (req, res) => {
    const moduleId = req.query.moduleId as string || 'mod_1';
    const gradeLevel = parseInt(req.query.gradeLevel as string) || 8;
    const tips = copilotService.getReviewChecklist(moduleId, gradeLevel);
    res.json(tips);
});

// CP-3: Get Assessment Guidance
router.get('/tips/assessment', (req, res) => {
    const type = (req.query.type as 'Quiz' | 'BossBattle') || 'Quiz';
    const tips = copilotService.getAssessmentGuidance(type);
    res.json(tips);
});

// CP-4: Get Personalization Hints
router.get('/tips/personalization', (req, res) => {
    const count = parseInt(req.query.studentCount as string) || 25;
    const tips = copilotService.getPersonalizationHints(count);
    res.json(tips);
});

export default router;
