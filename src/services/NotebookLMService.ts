import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

export interface NotebookLMResponse {
    answer: string;
    citations: Citation[];
    confidence: 'high' | 'medium' | 'low' | 'not_found';
    followUpSuggestions?: string[];
}

export interface Citation {
    source: string;
    quote: string;
    location?: string;
}

export interface NotebookMeta {
    name: string;
    subject?: string;
    description?: string;
    topics?: string[];
}

export interface NotebookEntry {
    id: string;
    url: string;
    name: string;
    description?: string;
    topics?: string[];
}

export class NotebookLMService {
    private client: Client;
    private transport: StdioClientTransport;
    private connected = false;

    constructor(
        mcpCommand = 'node',
        mcpArgs = ['/Users/user/notebooklm-mcp/dist/index.js']
    ) {
        this.transport = new StdioClientTransport({
            command: mcpCommand,
            args: mcpArgs,
        });
        this.client = new Client(
            { name: 'teacher-agent', version: '1.0.0' },
            { capabilities: {} }
        );
    }

    async connect(): Promise<void> {
        await this.client.connect(this.transport);
        this.connected = true;
    }

    async disconnect(): Promise<void> {
        if (this.connected) {
            await this.client.close();
            this.connected = false;
        }
    }

    isConnected(): boolean {
        return this.connected;
    }

    async isAvailable(): Promise<boolean> {
        return this.connected;
    }

    async query(question: string, notebookId?: string): Promise<NotebookLMResponse> {
        try {
            const args: Record<string, unknown> = { query: question };
            if (notebookId) args.notebook_id = notebookId;

            const result = await this.client.callTool({
                name: 'ask_question',
                arguments: args,
            });

            const text = (result.content as { type: string; text: string }[])[0]?.text;
            const parsed = JSON.parse(text);

            if (!parsed.success) {
                return {
                    answer: parsed.error || 'Query failed',
                    citations: [],
                    confidence: 'not_found',
                };
            }

            const data = parsed.data;
            return {
                answer: data.answer || data.response || '',
                citations: (data.citations || []).map((c: Record<string, string>) => ({
                    source: c.source || c.notebook || '',
                    quote: c.quote || c.text || '',
                    location: c.location || c.page || undefined,
                })),
                confidence: data.citations?.length > 0 ? 'high' : 'medium',
                followUpSuggestions: data.followUpSuggestions || data.suggestions,
            };
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            return {
                answer: `NotebookLM unavailable: ${message}`,
                citations: [],
                confidence: 'not_found',
            };
        }
    }

    async deepResearch(
        questions: string[],
        notebookId?: string
    ): Promise<NotebookLMResponse[]> {
        const results: NotebookLMResponse[] = [];
        for (const q of questions) {
            results.push(await this.query(q, notebookId));
        }
        return results;
    }

    async createFromUpload(url: string, meta: NotebookMeta): Promise<string> {
        const result = await this.client.callTool({
            name: 'add_notebook',
            arguments: {
                url,
                name: meta.name,
                description: meta.description || `Notebook for ${meta.name}`,
                topics: meta.topics || [meta.subject || 'general'],
            },
        });

        const text = (result.content as { type: string; text: string }[])[0]?.text;
        const parsed = JSON.parse(text);
        return parsed.data?.notebook?.id || '';
    }

    async listNotebooks(): Promise<NotebookEntry[]> {
        const result = await this.client.callTool({
            name: 'list_notebooks',
            arguments: {},
        });

        const text = (result.content as { type: string; text: string }[])[0]?.text;
        const parsed = JSON.parse(text);
        return (parsed.data?.notebooks || []).map((n: Record<string, unknown>) => ({
            id: n.id,
            url: n.url,
            name: n.name,
            description: n.description,
            topics: n.topics,
        }));
    }

    async selectNotebook(id: string): Promise<void> {
        await this.client.callTool({
            name: 'select_notebook',
            arguments: { notebook_id: id },
        });
    }

    async verifyContent(
        content: string,
        notebookId: string
    ): Promise<{ grounded: boolean; answer: string; citations: Citation[] }> {
        const verificationQuery = `Verify the following claim against the source material. Is this accurate and grounded in the documents? Claim: "${content}"`;
        const result = await this.query(verificationQuery, notebookId);
        return {
            grounded: result.confidence !== 'not_found',
            answer: result.answer,
            citations: result.citations,
        };
    }
}
