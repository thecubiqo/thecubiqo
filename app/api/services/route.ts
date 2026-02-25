import { NextResponse } from 'next/server'
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key'
);

function normalizeRow(row: RegionRow | null) {
  if (!row) return null;
  return {
    id: row.region_id,
    countryCode: row.country_code,
    name: row.name,
    locale: row.locale,
    routing: row.routing ?? {},
    localization: row.localization ?? {},
    cultural: row.cultural ?? {},
    appearance: row.appearance ?? {},
    features: row.features ?? {},
    ai: row.ai ?? {},
  };
}

export type RegionRow = {
  id: string;
  region_id: string;
  country_code: string;
  name: string;
  locale: string;
  routing: any;
  localization: any;
  cultural: any;
  appearance: any;
  features: any;
  ai: any;
  created_at?: string;
  updated_at?: string;
};

export async function getAllvalidRegin(): Promise<Record<string, any>> {
  try {
    const { data, error } = await supabaseAdmin
      .from("regions")
      .select("region_id");

    if (error) {
      throw error;
    }

    // Build a map like { [region_id]: true }
    const result: Record<string, any> = {};

    (data ?? []).forEach((row: { region_id: string | number }) => {
      result[row.region_id] = true;
    });

    return (data ?? []).map((row) => row.region_id);
  } catch (err) {
    
    // Decide how you want to fail: rethrow or return empty
    throw err;
    // or: return {};
  }
}

export async function getRegionByRegionId(
  regionId: string
): Promise<any | null> {
  try {
    if (typeof regionId !== "string" || regionId.trim().length === 0) {
      throw new Error("regionId must be a non-empty string");
    }

    const { data, error } = await supabaseAdmin
      .from("regions")
      .select("*")
      .eq("region_id", regionId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data) {
      return null;
    }

    if (data.region_id !== regionId) {
      throw new Error("Region data is inconsistent with requested regionId");
    }

    return normalizeRow(data);
  } catch (err) {
    

    throw err;
  }
}

// Next.js API route handler
export async function GET() {
  return NextResponse.json({ message: 'Services API endpoint' })
}
