import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotebookSharingService } from '../services/NotebookSharingService.js';

const mockPrisma = {
    notebookRegistry: {
        create: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    },
    notebookShare: {
        create: vi.fn(),
        findMany: vi.fn(),
        findFirst: vi.fn(),
        delete: vi.fn(),
        deleteMany: vi.fn(),
    },
};

describe('NotebookSharingService', () => {
    let service: NotebookSharingService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new NotebookSharingService(mockPrisma as any);
    });

    it('should register a new notebook', async () => {
        const input = {
            notebooklmId: 'prealgebra-2e',
            notebooklmUrl: 'https://notebooklm.google.com/notebook/abc',
            title: 'Prealgebra 2e',
            subject: 'Math',
            ownerDid: 'teacher-1',
        };
        mockPrisma.notebookRegistry.create.mockResolvedValue({ id: 'uuid-1', ...input });
        const result = await service.register(input);
        expect(result.id).toBe('uuid-1');
        expect(mockPrisma.notebookRegistry.create).toHaveBeenCalledWith({
            data: expect.objectContaining({ title: 'Prealgebra 2e' })
        });
    });

    it('should find notebooks by owner', async () => {
        mockPrisma.notebookRegistry.findMany.mockResolvedValue([
            { id: '1', title: 'Math', ownerDid: 'teacher-1' }
        ]);
        const results = await service.findByOwner('teacher-1');
        expect(results).toHaveLength(1);
    });

    it('should find notebooks shared with a user', async () => {
        mockPrisma.notebookShare.findMany.mockResolvedValue([
            { notebookId: 'nb-1', sharedWithDid: 'teacher-2' }
        ]);
        mockPrisma.notebookRegistry.findMany.mockResolvedValue([
            { id: 'nb-1', title: 'Shared Math' }
        ]);
        const results = await service.findSharedWith('teacher-2');
        expect(results).toHaveLength(1);
    });

    it('should return empty for users with no shares', async () => {
        mockPrisma.notebookShare.findMany.mockResolvedValue([]);
        const results = await service.findSharedWith('noone');
        expect(results).toEqual([]);
    });

    it('should share a notebook with another teacher', async () => {
        mockPrisma.notebookShare.create.mockResolvedValue({ id: 'share-1' });
        await service.share('notebook-1', 'teacher-2', 'reader', 'teacher-1');
        expect(mockPrisma.notebookShare.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                notebookId: 'notebook-1',
                sharedWithDid: 'teacher-2',
                role: 'reader',
            })
        });
    });

    it('should check access — owner always has access', async () => {
        mockPrisma.notebookRegistry.findUnique.mockResolvedValue({
            id: 'nb-1', ownerDid: 'teacher-1', visibility: 'private'
        });
        const canAccess = await service.canAccess('nb-1', 'teacher-1');
        expect(canAccess).toBe(true);
    });

    it('should check access — shared user has access', async () => {
        mockPrisma.notebookRegistry.findUnique.mockResolvedValue({
            id: 'nb-1', ownerDid: 'teacher-1', visibility: 'private'
        });
        mockPrisma.notebookShare.findFirst.mockResolvedValue({ id: 'share-1' });
        const canAccess = await service.canAccess('nb-1', 'teacher-2');
        expect(canAccess).toBe(true);
    });

    it('should deny access — no share, private', async () => {
        mockPrisma.notebookRegistry.findUnique.mockResolvedValue({
            id: 'nb-1', ownerDid: 'teacher-1', visibility: 'private'
        });
        mockPrisma.notebookShare.findFirst.mockResolvedValue(null);
        const canAccess = await service.canAccess('nb-1', 'student-1');
        expect(canAccess).toBe(false);
    });

    it('should allow access for public notebooks', async () => {
        mockPrisma.notebookRegistry.findUnique.mockResolvedValue({
            id: 'nb-1', ownerDid: 'teacher-1', visibility: 'public'
        });
        const canAccess = await service.canAccess('nb-1', 'anyone');
        expect(canAccess).toBe(true);
    });

    it('should deny access when notebook not found', async () => {
        mockPrisma.notebookRegistry.findUnique.mockResolvedValue(null);
        const canAccess = await service.canAccess('nonexistent', 'anyone');
        expect(canAccess).toBe(false);
    });

    it('should unshare a notebook', async () => {
        mockPrisma.notebookShare.deleteMany.mockResolvedValue({ count: 1 });
        await service.unshare('nb-1', 'teacher-2');
        expect(mockPrisma.notebookShare.deleteMany).toHaveBeenCalledWith({
            where: { notebookId: 'nb-1', sharedWithDid: 'teacher-2' }
        });
    });

    it('should return access level — owner', async () => {
        mockPrisma.notebookRegistry.findUnique.mockResolvedValue({
            id: 'nb-1', ownerDid: 'teacher-1', visibility: 'private'
        });
        const level = await service.getAccessLevel('nb-1', 'teacher-1');
        expect(level).toBe('owner');
    });

    it('should return access level — contributor', async () => {
        mockPrisma.notebookRegistry.findUnique.mockResolvedValue({
            id: 'nb-1', ownerDid: 'teacher-1', visibility: 'private'
        });
        mockPrisma.notebookShare.findFirst.mockResolvedValue({ role: 'contributor' });
        const level = await service.getAccessLevel('nb-1', 'teacher-2');
        expect(level).toBe('contributor');
    });

    it('should return null access level for unauthorized', async () => {
        mockPrisma.notebookRegistry.findUnique.mockResolvedValue({
            id: 'nb-1', ownerDid: 'teacher-1', visibility: 'private'
        });
        mockPrisma.notebookShare.findFirst.mockResolvedValue(null);
        const level = await service.getAccessLevel('nb-1', 'stranger');
        expect(level).toBeNull();
    });
});
