import { z } from 'zod';

export type TemplateType =
    | 'SemesterBlueprint'
    | 'ModuleDesignDoc'
    | 'LessonContentPack'
    | 'AssessmentSuite'
    | 'QuestDesign'
    | 'ProgressReportTemplate'
    | 'VerificationChecklist';

export interface PlaybookTemplate {
    type: TemplateType;
    name: string;
    description: string;
    schema: z.ZodSchema;
    defaultContent: Record<string, any>;
    aiFillableFields: string[];
}

// 1. Semester Blueprint
export const SemesterBlueprintSchema = z.object({
    title: z.string(),
    academicYear: z.string(),
    subject: z.string(),
    gradeLevel: z.string(),
    startDate: z.string(),
    endDate: z.string(),
    totalWeeks: z.number(),
    milestones: z.array(z.object({
        week: z.number(),
        topic: z.string(),
        type: z.enum(['Instruction', 'Review', 'Exam', 'Project', 'Break']),
        standards: z.array(z.string())
    })),
    holidays: z.array(z.string()), // Dates
    driftBufferWeeks: z.number().default(2)
});

// 2. Module Design Doc
export const ModuleDesignDocSchema = z.object({
    moduleId: z.string(),
    title: z.string(),
    durationWeeks: z.number(),
    learningObjectives: z.array(z.string()),
    keyConcepts: z.array(z.string()),
    learningModes: z.array(z.enum(['Text', 'Comic', 'Podcast', 'Video', 'Quest', 'Lab'])),
    assessmentStrategy: z.object({
        formativeCount: z.number(),
        summativeType: z.enum(['Quiz', 'BossBattle', 'Project']),
        rubricId: z.string().optional()
    }),
    teacherCameoIdea: z.string().optional()
});

// 3. Lesson Content Pack
export const LessonContentPackSchema = z.object({
    moduleId: z.string(),
    lessonText: z.string(),
    comics: z.array(z.object({
        panelId: z.number(),
        description: z.string(),
        dialogue: z.string()
    })).optional(),
    podcastScript: z.object({
        host1: z.string(),
        host2: z.string(),
        transcript: z.array(z.object({ speaker: z.string(), text: z.string() }))
    }).optional(),
    mindMapNodes: z.array(z.object({
        id: z.string(),
        label: z.string(),
        parentId: z.string().optional()
    })).optional(),
    flashcards: z.array(z.object({
        front: z.string(),
        back: z.string()
    })).optional()
});

// 4. Assessment Suite
export const AssessmentSuiteSchema = z.object({
    moduleId: z.string(),
    quizzes: z.array(z.object({
        title: z.string(),
        questions: z.array(z.object({
            question: z.string(),
            options: z.array(z.string()),
            correctIndex: z.number(),
            explanation: z.string()
        }))
    })),
    bossBattle: z.object({
        title: z.string(),
        scenario: z.string(),
        multipleChoicePart: z.array(z.any()),
        openResponsePart: z.array(z.string()),
        rubric: z.record(z.string(), z.string())
    }),
    feynmanPrompt: z.string() // "Explain X to me like I'm 5..."
});

// 5. Quest Design
export const QuestDesignSchema = z.object({
    title: z.string(),
    narrativeHook: z.string(), // "The Kingdom is crumbling..."
    objectives: z.array(z.string()),
    rewards: z.object({
        xp: z.number(),
        items: z.array(z.string()),
        badges: z.array(z.string())
    }),
    steps: z.array(z.object({
        stepId: z.number(),
        description: z.string(),
        unlockCondition: z.string()
    }))
});

// 6. Verification Checklist (Traffic Light)
export const VerificationChecklistSchema = z.object({
    moduleId: z.string(),
    status: z.enum(['Red', 'Yellow', 'Green']),
    flags: z.array(z.object({
        severity: z.enum(['Critical', 'Warning', 'Info']),
        category: z.enum(['Worldview', 'Pedagogy', 'Accuracy', 'Safety']),
        description: z.string(),
        location: z.string(),
        resolved: z.boolean()
    })),
    teacherSignoff: z.boolean(),
    signoffDate: z.string().optional()
});

// Registry
export const TEMPLATES: Record<TemplateType, PlaybookTemplate> = {
    SemesterBlueprint: {
        type: 'SemesterBlueprint',
        name: 'Semester Blueprint',
        description: 'Full-year plan with milestones and standards',
        schema: SemesterBlueprintSchema,
        defaultContent: { totalWeeks: 36, milestones: [] },
        aiFillableFields: ['milestones', 'standards']
    },
    ModuleDesignDoc: {
        type: 'ModuleDesignDoc',
        name: 'Module Design Document',
        description: 'Unit-level planning and objectives',
        schema: ModuleDesignDocSchema,
        defaultContent: { durationWeeks: 1, learningModes: ['Text', 'Podcast'] },
        aiFillableFields: ['learningObjectives', 'keyConcepts', 'teacherCameoIdea']
    },
    LessonContentPack: {
        type: 'LessonContentPack',
        name: 'Lesson Content Pack',
        description: 'Multimodal content generation specs',
        schema: LessonContentPackSchema,
        defaultContent: {},
        aiFillableFields: ['lessonText', 'comics', 'podcastScript', 'mindMapNodes', 'flashcards']
    },
    AssessmentSuite: {
        type: 'AssessmentSuite',
        name: 'Assessment Suite',
        description: 'Quizzes, tests, and Feynman prompts',
        schema: AssessmentSuiteSchema,
        defaultContent: {},
        aiFillableFields: ['quizzes', 'bossBattle', 'feynmanPrompt']
    },
    QuestDesign: {
        type: 'QuestDesign',
        name: 'Quest Design',
        description: 'Gamified narrative layer',
        schema: QuestDesignSchema,
        defaultContent: { rewards: { xp: 100, items: [], badges: [] } },
        aiFillableFields: ['narrativeHook', 'steps', 'rewards']
    },
    ProgressReportTemplate: {
        type: 'ProgressReportTemplate',
        name: 'Progress Report',
        description: 'Student mastery digest',
        schema: z.any(), // Placeholder
        defaultContent: {},
        aiFillableFields: []
    },
    VerificationChecklist: {
        type: 'VerificationChecklist',
        name: 'Verification Checklist',
        description: 'Compliance and safety review',
        schema: VerificationChecklistSchema,
        defaultContent: { status: 'Red', flags: [], teacherSignoff: false },
        aiFillableFields: ['flags', 'status']
    }
};

export class PlaybookTemplateService {
    getTemplate(type: TemplateType): PlaybookTemplate {
        return TEMPLATES[type];
    }

    validateContent(type: TemplateType, content: any): { success: boolean; errors?: any } {
        const template = this.getTemplate(type);
        const result = template.schema.safeParse(content);
        if (!result.success) {
            return { success: false, errors: result.error.errors };
        }
        return { success: true };
    }

    listTemplates() {
        return Object.values(TEMPLATES).map(t => ({
            type: t.type,
            name: t.name,
            description: t.description
        }));
    }
}
