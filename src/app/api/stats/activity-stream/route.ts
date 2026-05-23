/**
 * Landing page activity stream
 * GET /api/stats/activity-stream?limit=12
 * Public — no auth. Returns anonymised curated activity items for the landing page.
 * Cached 60s / stale-while-revalidate 5m.
 * Source: CubiQo-UI-Architecture.md Screen 1
 */
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

// Curated items representative of real platform activity, fully anonymised.
// Replace with real anonymised DB data once platform has live users.
const CURATED_ITEMS = [
  { id: "c1",  color: "green",  text: "Just completed a Shopify launch — 12 products live",              handle: "@a creator in Manchester"  },
  { id: "c2",  color: "red",    text: "Missed three gym sessions. CubiQo helped me get back on track",   handle: "@someone in London"        },
  { id: "c3",  color: "green",  text: "Set a goal: reach £10k/month by end of Q3",                       handle: "@a freelancer in Bristol"  },
  { id: "c4",  color: "yellow", text: "Capsule in progress: job application for a PM role",              handle: "@someone in Edinburgh"     },
  { id: "c5",  color: "green",  text: "Memory updated: 6am gym routine, 4 weeks strong",                 handle: "@a founder"                },
  { id: "c6",  color: "red",    text: "Overwhelmed by inbox. Started a capsule to triage it",            handle: "@someone"                  },
  { id: "c7",  color: "green",  text: "Task done: replied to all partnership enquiries",                 handle: "@a creator"                },
  { id: "c8",  color: "yellow", text: "Planning phase: new side project in the food space",              handle: "@someone in Leeds"         },
  { id: "c9",  color: "green",  text: "Weekly review done — three goals advanced this week",             handle: "@a business owner"         },
  { id: "c10", color: "red",    text: "Hard day. CubiQo just listened. Sometimes that's enough",         handle: "@someone"                  },
  { id: "c11", color: "green",  text: "First affiliate commission from a recommendation",                handle: "@a creator in London"      },
  { id: "c12", color: "yellow", text: "Research capsule: comparing SaaS tools for scheduling",          handle: "@a freelancer"             },
  { id: "c13", color: "green",  text: "Capsule complete: portfolio website live in 3 days",             handle: "@a designer in Dublin"     },
  { id: "c14", color: "red",    text: "Burnout signal detected. CubiQo suggested a reset week",         handle: "@someone"                  },
  { id: "c15", color: "yellow", text: "Research mode: 14 tabs open on AI tooling — time to decide",     handle: "@a product manager"        },
] as const;

export async function GET(request: NextRequest) {
  const raw = new URL(request.url).searchParams.get("limit");
  const limit = Math.min(Math.max(parseInt(raw ?? "12", 10), 1), 20);

  // Shuffle on every request so the stream feels live
  const shuffled = [...CURATED_ITEMS]
    .sort(() => Math.random() - 0.5)
    .slice(0, limit);

  return NextResponse.json(
    { items: shuffled, total: CURATED_ITEMS.length },
    {
      headers: {
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      },
    }
  );
}
