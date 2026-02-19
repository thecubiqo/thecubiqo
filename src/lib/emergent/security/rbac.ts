/**
 * Role-Based Access Control for Emergent Platform
 */

import { createClient } from '@/lib/supabase/server';

export async function requireSecretAccess(userId: string, projectId: string): Promise<boolean> {
    try {
        const supabase = await createClient();

        // 1. Get project's org
        const { data: project } = await supabase
            .from('emergent_projects')
            .select('org_id')
            .eq('id', projectId)
            .single();

        if (!project) return false;

        // 2. Check user's role in org
        const { data: member } = await supabase
            .from('emergent_org_members')
            .select('role')
            .eq('org_id', project.org_id)
            .eq('user_id', userId)
            .single();

        if (!member) return false;

        // Only owners and admins can access secrets
        return ['owner', 'admin'].includes(member.role);
    } catch (error) {
        console.error('RBAC check failed:', error);
        return false;
    }
}

export async function requireProjectAccess(userId: string, projectId: string): Promise<boolean> {
    try {
        const supabase = await createClient();

        const { data: project } = await supabase
            .from('emergent_projects')
            .select('org_id')
            .eq('id', projectId)
            .single();

        if (!project) return false;

        const { data: member } = await supabase
            .from('emergent_org_members')
            .select('role')
            .eq('org_id', project.org_id)
            .eq('user_id', userId)
            .single();

        return !!member; // Any member can access/view project
    } catch (error) {
        console.error('RBAC check failed:', error);
        return false;
    }
}
