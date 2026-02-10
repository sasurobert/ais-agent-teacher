import { describe, it, expect } from 'vitest';
import { VerificationChecklistSchema } from '../services/playbook-templates.js';

describe('VerificationChecklistSchema — SourceGrounding', () => {

    const baseChecklist = {
        moduleId: 'mod-1',
        status: 'Green' as const,
        teacherSignoff: true,
        signoffDate: '2026-02-10',
    };

    // VC-01
    it('validates flag with subcategory SourceGrounding', () => {
        const data = {
            ...baseChecklist,
            flags: [{
                severity: 'Warning',
                category: 'Accuracy',
                subcategory: 'SourceGrounding',
                description: 'Claim not found in source material',
                location: 'Section 3.2',
                resolved: false,
            }]
        };
        const result = VerificationChecklistSchema.safeParse(data);
        expect(result.success).toBe(true);
    });

    // VC-02
    it('validates flag with notebookLMCitation object', () => {
        const data = {
            ...baseChecklist,
            flags: [{
                severity: 'Info',
                category: 'Accuracy',
                subcategory: 'FactCheck',
                description: 'Verified improper fractions definition',
                location: 'Lesson 4.1',
                resolved: true,
                notebookLMCitation: {
                    source: 'Prealgebra 2e',
                    quote: 'A fraction where the numerator is greater than the denominator',
                    location: 'Page 247',
                }
            }]
        };
        const result = VerificationChecklistSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.flags[0].notebookLMCitation?.source).toBe('Prealgebra 2e');
        }
    });

    // VC-03
    it('rejects invalid subcategory value', () => {
        const data = {
            ...baseChecklist,
            flags: [{
                severity: 'Warning',
                category: 'Accuracy',
                subcategory: 'InvalidSubcategory',
                description: 'test',
                location: 'test',
                resolved: false,
            }]
        };
        const result = VerificationChecklistSchema.safeParse(data);
        expect(result.success).toBe(false);
    });

    // Extra: flag without subcategory still valid (subcategory is optional)
    it('validates flag without subcategory (backwards compatible)', () => {
        const data = {
            ...baseChecklist,
            flags: [{
                severity: 'Critical',
                category: 'Worldview',
                description: 'Content violates worldview guidelines',
                location: 'Module Intro',
                resolved: false,
            }]
        };
        const result = VerificationChecklistSchema.safeParse(data);
        expect(result.success).toBe(true);
    });

    // Extra: flag without notebookLMCitation still valid (citation is optional)
    it('validates flag without notebookLMCitation', () => {
        const data = {
            ...baseChecklist,
            flags: [{
                severity: 'Warning',
                category: 'Pedagogy',
                subcategory: 'General',
                description: 'Content too complex for grade level',
                location: 'Section 2',
                resolved: false,
            }]
        };
        const result = VerificationChecklistSchema.safeParse(data);
        expect(result.success).toBe(true);
    });
});
