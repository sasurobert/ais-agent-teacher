export interface CopilotTip {
    id: string;
    category: 'Ingestion' | 'Review' | 'Assessment' | 'Personalization' | 'Compliance';
    title: string;
    content: string;
    actionable?: boolean;
    priority: 'High' | 'Medium' | 'Low' | 'Critical';
}

export class PlaybookCopilotService {

    getIngestionTips(sourceType: 'PDF' | 'EPUB' | 'Web'): CopilotTip[] {
        const tips: CopilotTip[] = [
            {
                id: 'ingest-quality',
                category: 'Ingestion',
                title: 'Source Quality Matters',
                content: 'Ensure your PDF is a high-quality digital export, not a scan. OCR errors in scans can lead to "hallucinated" curriculum concepts.',
                priority: 'High'
            },
            {
                id: 'ingest-standards',
                category: 'Ingestion',
                title: 'Include Standards',
                content: 'Upload your state/national standards document alongside the textbook. This allows the AI to map every lesson directly to a requirement.',
                priority: 'Medium'
            }
        ];

        if (sourceType === 'PDF') {
            tips.push({
                id: 'ingest-pdf-toc',
                category: 'Ingestion',
                title: 'Check the TOC',
                content: 'Verify that the Table of Contents was parsed correctly. If the chapters are wrong, the whole semester plan will be skewed.',
                priority: 'High'
            });
        }

        return tips;
    }

    getReviewChecklist(moduleId: string, gradeLevel: number): CopilotTip[] {
        const tips: CopilotTip[] = [
            {
                id: 'review-preview',
                category: 'Review',
                title: `Preview as Grade ${gradeLevel}`,
                content: 'Always use the "Student View" button before publishing. AI generated content often sounds too dry or too complex.',
                priority: 'High',
                actionable: true
            },
            {
                id: 'review-cameo',
                category: 'Review',
                title: 'Record a Cameo',
                content: 'Students engage 40% more when they see your face. Record a 30s intro video for this module.',
                priority: 'Medium',
                actionable: true
            }
        ];

        if (gradeLevel < 6) {
            tips.push({
                id: 'review-voice',
                category: 'Review',
                title: 'Read Aloud Check',
                content: 'Read the "Comic Script" dialogue aloud. Does it sound like how an 8-year-old speaks?',
                priority: 'Medium'
            });
        }

        return tips;
    }

    getAssessmentGuidance(assessmentType: 'Quiz' | 'BossBattle'): CopilotTip[] {
        if (assessmentType === 'BossBattle') {
            return [
                {
                    id: 'assess-boss-summative',
                    category: 'Assessment',
                    title: 'Summative Only',
                    content: 'Boss Battles are high-stakes. Use them only for end-of-unit verification, never for practice.',
                    priority: 'High'
                },
                {
                    id: 'assess-rubric',
                    category: 'Assessment',
                    title: 'Rubric Alignment',
                    content: 'Ensure the Boss Battle rubric matches the official exam standards exactly. AI can drift into "general correctness".',
                    priority: 'Critical'
                }
            ];
        }

        return [
            {
                id: 'assess-quiz-mix',
                category: 'Assessment',
                title: '80/20 Rule',
                content: 'Mix 80% AI-generated questions with 20% of your own custom questions to add your specific flavor.',
                priority: 'Low'
            }
        ];
    }

    getPersonalizationHints(studentCount: number): CopilotTip[] {
        return [
            {
                id: 'pers-roster',
                category: 'Personalization',
                title: 'Feed the Roster',
                content: `You have ${studentCount} students. Ensure their "Interests" are updated in the profile. The AI uses this to generate metaphors (e.g. using Minecraft for geometry).`,
                priority: 'High'
            },
            {
                id: 'pers-modes',
                category: 'Personalization',
                title: 'Mode Variety',
                content: 'Don\'t overuse the "Comic" mode. Students need text for deep reading stamina. Use Comics for hooks, Text for depth.',
                priority: 'Medium'
            }
        ];
    }
}
