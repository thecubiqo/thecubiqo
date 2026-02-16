import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { toggleFeatureFlag } from '@/lib/feature-flags/server'

interface DashboardFeature {
    id: string
    feature_id: string
    name: string
    description: string
    enabled_for_production: boolean
    risk_level: 'safe' | 'warning' | 'dangerous'
    category: string
}

export async function GET(request: NextRequest) {
    const supabase = await createClient()

    // Fetch all feature flags
    const { data: flags, error } = await supabase
        .from('feature_flags')
        .select('*')
        .order('created_at', { ascending: false })

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Map to dashboard format
    const features: DashboardFeature[] = (flags || []).map((f: any) => {
        // Determine feature_id: prefer explicit feature_id column, fallback to name
        const featureId = f.feature_id || f.name;

        // Determine risk level based on keywords if not explicit
        let risk: 'safe' | 'warning' | 'dangerous' = 'safe';
        if (f.risk_level) {
            risk = f.risk_level;
        } else {
            const lowerName = f.name.toLowerCase();
            if (lowerName.includes('write') || lowerName.includes('delete') || lowerName.includes('exec') || lowerName.includes('shell')) {
                risk = 'dangerous';
            } else if (lowerName.includes('read') || lowerName.includes('fetch')) {
                risk = 'warning';
            }
        }

        // Determine category
        let category = f.category || 'general';
        if (!f.category) {
            // Simple heuristics if category is missing
            if (featureId.startsWith('ui.')) category = 'tools';
            else if (f.name.includes('Gmail') || f.name.includes('Slack')) category = 'integrations';
        }

        return {
            id: f.id,
            feature_id: featureId,
            name: f.name, // Display name
            description: f.description || '',
            enabled_for_production: f.enabled === true, // Ensure boolean
            risk_level: risk,
            category: category
        };
    });

    return NextResponse.json({ features })
}

export async function POST(request: NextRequest) {
    const body = await request.json()
    const { feature_id, enabled } = body

    if (!feature_id) {
        return NextResponse.json({ error: 'Missing feature_id' }, { status: 400 })
    }

    const supabase = await createClient()

    // Try to find by feature_id col first, then name
    let { data: flag } = await supabase
        .from('feature_flags')
        .select('id')
        .eq('feature_id', feature_id)
        .single()

    if (!flag) {
        // Fallback search by name
        const { data: flagByName } = await supabase
            .from('feature_flags')
            .select('id')
            .eq('name', feature_id)
            .single();

        flag = flagByName;
    }

    if (!flag) {
        return NextResponse.json({ error: 'Flag not found' }, { status: 404 })
    }

    const { data, error } = await toggleFeatureFlag(flag.id, enabled)

    if (error) {
        return NextResponse.json({ error }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
}
