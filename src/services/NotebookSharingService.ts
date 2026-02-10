import type { PrismaClient } from '@prisma/client';

export interface NotebookRegistryInput {
    notebooklmId: string;
    notebooklmUrl: string;
    title: string;
    description?: string;
    subject?: string;
    gradeLevel?: string;
    sourcePdfHash?: string;
    ownerDid: string;
    visibility?: string;
    tags?: string[];
}

export class NotebookSharingService {
    constructor(private prisma: PrismaClient) { }

    async register(input: NotebookRegistryInput) {
        return this.prisma.notebookRegistry.create({
            data: {
                notebooklmId: input.notebooklmId,
                notebooklmUrl: input.notebooklmUrl,
                title: input.title,
                description: input.description ?? null,
                subject: input.subject ?? null,
                gradeLevel: input.gradeLevel ?? null,
                sourcePdfHash: input.sourcePdfHash ?? null,
                ownerDid: input.ownerDid,
                visibility: input.visibility || 'private',
                tags: input.tags || [],
            },
        });
    }

    async findByOwner(ownerDid: string) {
        return this.prisma.notebookRegistry.findMany({
            where: { ownerDid },
            include: { shares: true },
        });
    }

    async findSharedWith(userDid: string) {
        const shares = await this.prisma.notebookShare.findMany({
            where: { sharedWithDid: userDid },
        });
        const notebookIds = shares.map((s) => s.notebookId);
        if (notebookIds.length === 0) return [];
        return this.prisma.notebookRegistry.findMany({
            where: { id: { in: notebookIds } },
        });
    }

    async share(
        notebookId: string,
        targetDid: string,
        role: 'reader' | 'contributor',
        sharedByDid: string
    ) {
        return this.prisma.notebookShare.create({
            data: { notebookId, sharedWithDid: targetDid, role, sharedByDid },
        });
    }

    async unshare(notebookId: string, targetDid: string) {
        return this.prisma.notebookShare.deleteMany({
            where: { notebookId, sharedWithDid: targetDid },
        });
    }

    async getShares(notebookId: string) {
        return this.prisma.notebookShare.findMany({
            where: { notebookId },
        });
    }

    async canAccess(notebookId: string, userDid: string): Promise<boolean> {
        const notebook = await this.prisma.notebookRegistry.findUnique({
            where: { id: notebookId },
        });
        if (!notebook) return false;
        if (notebook.ownerDid === userDid) return true;
        if (notebook.visibility === 'public') return true;

        const share = await this.prisma.notebookShare.findFirst({
            where: { notebookId, sharedWithDid: userDid },
        });
        return !!share;
    }

    async getAccessLevel(
        notebookId: string,
        userDid: string
    ): Promise<'owner' | 'contributor' | 'reader' | null> {
        const notebook = await this.prisma.notebookRegistry.findUnique({
            where: { id: notebookId },
        });
        if (!notebook) return null;
        if (notebook.ownerDid === userDid) return 'owner';

        const share = await this.prisma.notebookShare.findFirst({
            where: { notebookId, sharedWithDid: userDid },
        });
        if (!share) {
            if (notebook.visibility === 'public') return 'reader';
            return null;
        }
        return share.role as 'reader' | 'contributor';
    }
}
