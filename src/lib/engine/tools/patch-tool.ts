import { Tool, ToolContext, ToolResult } from '@/types/tool';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

export const patchTool: Tool = {
    id: 'file_patch',
    name: 'Patch File',
    description: 'Apply a precise search/replace patch to a file. safer than full write for small changes.',
    parameters: {
        type: 'object',
        properties: {
            path: { type: 'string', description: 'File path relative to workspace' },
            search: { type: 'string', description: 'Exact string to search for/replace' },
            replace: { type: 'string', description: 'New string content' },
        },
        required: ['path', 'search', 'replace'],
    },
    execute: async (params: any, context: ToolContext): Promise<ToolResult> => {
        try {
            const { path, search, replace } = params;
            const fullPath = join(context.workspace, path);

            const content = await readFile(fullPath, 'utf-8');

            if (!content.includes(search)) {
                // Normalized fallback: try trimming
                if (content.includes(search.trim())) {
                    const newContent = content.replace(search.trim(), replace);
                    await writeFile(fullPath, newContent, 'utf-8');
                    return { success: true, output: `Patched ${path} (trimmed match)` };
                }

                return {
                    success: false,
                    output: '',
                    error: `Search string not found in ${path}. Ensure exact match.`,
                };
            }

            const newContent = content.replace(search, replace);
            await writeFile(fullPath, newContent, 'utf-8');

            return {
                success: true,
                output: `Successfully patched ${path}`,
            };
        } catch (error) {
            return {
                success: false,
                output: '',
                error: error instanceof Error ? error.message : 'Patch failed',
            };
        }
    },
};
