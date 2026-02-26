
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/app/api/emergent/preview/[slug]/route';
import { createClient } from '@/lib/supabase/server';

// Mock Supabase client
vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn(),
}));

describe('Project Preview API', () => {
    const mockSupabase = {
        from: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        (createClient as any).mockResolvedValue(mockSupabase);
    });

    it('should return 400 if slug is missing', async () => {
        const request = new NextRequest('http://localhost/api/emergent/preview/');
        const response = await GET(request, { params: Promise.resolve({ slug: '' }) });

        expect(response.status).toBe(400);
        const data = await response.json() as any;
        expect(data.error).toBe('Missing or invalid slug');
    });

    it('should return 404 if project is not found', async () => {
        mockSupabase.single.mockResolvedValue({ data: null, error: { message: 'Not found' } });

        const request = new NextRequest('http://localhost/api/emergent/preview/test-slug');
        const response = await GET(request, { params: Promise.resolve({ slug: 'test-slug' }) });

        expect(response.status).toBe(404);
        const data = await response.json() as any;
        expect(data.error).toBe('Project not found');
    });

    it('should return workspace details if found', async () => {
        const mockWorkspace = {
            id: 'ws-123',
            project_id: 'proj-456',
            name: 'test-project',
            runtime: 'nodejs',
            status: 'running',
            preview_url: 'https://preview.com',
            port: 3000,
            ip_address: '1.2.3.4',
        };
        mockSupabase.single.mockResolvedValue({ data: mockWorkspace, error: null });

        const request = new NextRequest('http://localhost/api/emergent/preview/test-project');
        const response = await GET(request, { params: Promise.resolve({ slug: 'test-project' }) });

        expect(response.status).toBe(200);
        const data = await response.json() as any;
        expect(data.project.name).toBe('test-project');
        expect(data.project.previewUrl).toBe('https://preview.com');
    });

    it('should construct previewUrl from ip and port if not provided', async () => {
        const mockWorkspace = {
            id: 'ws-123',
            project_id: 'proj-456',
            name: 'test-project',
            runtime: 'nodejs',
            status: 'running',
            preview_url: null,
            port: 3000,
            ip_address: '1.2.3.4',
        };
        mockSupabase.single.mockResolvedValue({ data: mockWorkspace, error: null });

        const request = new NextRequest('http://localhost/api/emergent/preview/test-project');
        const response = await GET(request, { params: Promise.resolve({ slug: 'test-project' }) });

        expect(response.status).toBe(200);
        const data = await response.json() as any;
        expect(data.project.previewUrl).toBe('http://1.2.3.4:3000');
    });
});
