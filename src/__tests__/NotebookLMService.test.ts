import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotebookLMService } from '../services/NotebookLMService.js';

// Mock the MCP SDK
vi.mock('@modelcontextprotocol/sdk/client/index.js', () => ({
    Client: class MockClient {
        connect = vi.fn();
        close = vi.fn();
        listTools = vi.fn().mockResolvedValue({ tools: [{ name: 'ask_question' }] });
        callTool = vi.fn().mockImplementation(({ name }: { name: string }) => {
            if (name === 'ask_question') {
                return {
                    content: [{
                        type: 'text',
                        text: JSON.stringify({
                            success: true,
                            data: {
                                answer: 'Improper fractions have numerator greater than denominator',
                                citations: [{ source: 'Prealgebra2e', quote: 'An improper fraction...', page: '247' }]
                            }
                        })
                    }]
                };
            }
            if (name === 'list_notebooks') {
                return {
                    content: [{
                        type: 'text',
                        text: JSON.stringify({ success: true, data: { notebooks: [] } })
                    }]
                };
            }
            if (name === 'add_notebook') {
                return {
                    content: [{
                        type: 'text',
                        text: JSON.stringify({
                            success: true,
                            data: { notebook: { id: 'test-notebook-id' } }
                        })
                    }]
                };
            }
            if (name === 'select_notebook') {
                return { content: [{ type: 'text', text: JSON.stringify({ success: true }) }] };
            }
            return { content: [{ type: 'text', text: '{}' }] };
        });
    }
}));

vi.mock('@modelcontextprotocol/sdk/client/stdio.js', () => ({
    StdioClientTransport: class MockTransport { }
}));

describe('NotebookLMService', () => {
    let service: NotebookLMService;

    beforeEach(() => {
        service = new NotebookLMService();
    });

    it('should connect to MCP server', async () => {
        await service.connect();
        expect(service.isConnected()).toBe(true);
    });

    it('should query a notebook and return citations', async () => {
        await service.connect();
        const result = await service.query('What are improper fractions?');
        expect(result.answer).toContain('Improper fractions');
        expect(result.citations).toHaveLength(1);
        expect(result.confidence).toBe('high');
    });

    it('should create a notebook from upload', async () => {
        await service.connect();
        const id = await service.createFromUpload(
            'https://notebooklm.google.com/notebook/abc123',
            { name: 'Prealgebra 2e', subject: 'Math' }
        );
        expect(id).toBe('test-notebook-id');
    });

    it('should list notebooks', async () => {
        await service.connect();
        const notebooks = await service.listNotebooks();
        expect(notebooks).toEqual([]);
    });

    it('should report unavailable when not connected', async () => {
        expect(await service.isAvailable()).toBe(false);
    });

    it('should gracefully handle MCP errors', async () => {
        await service.connect();
        const clientInstance = (service as any).client;
        clientInstance.callTool = vi.fn().mockRejectedValueOnce(new Error('MCP timeout'));

        const result = await service.query('test');
        expect(result.confidence).toBe('not_found');
        expect(result.answer).toContain('unavailable');
    });

    it('should verify content against source', async () => {
        await service.connect();
        const result = await service.verifyContent('Fractions are parts of a whole', 'nb-1');
        expect(result.grounded).toBe(true);
        expect(result.answer).toBeDefined();
    });

    it('should deep research with multiple questions', async () => {
        await service.connect();
        const results = await service.deepResearch(['Q1', 'Q2']);
        expect(results).toHaveLength(2);
        expect(results[0].answer).toContain('Improper fractions');
    });
});
