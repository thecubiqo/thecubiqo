/**
 * Domain Intelligence Addendums
 * Deep domain knowledge injected per capsule type.
 * One generic prompt cannot be expert-level in 8 domains simultaneously.
 *
 * Philosophy base layer injected into ALL addendums:
 * - First principles (Aristotle/Musk)
 * - Inversion (Munger) — what could go wrong?
 * - Second-order consequences
 * - Regret minimization (Bezos)
 * - Stoic action bias — focus only on what you control
 */

import type { DomainKey } from './reconnaissance';

// ─────────────────────────────────────────────────────────────────────────────
// Base philosophy layer — injected into ALL addendums
// ─────────────────────────────────────────────────────────────────────────────

const PHILOSOPHY_BASE = `
THINKING FRAMEWORKS (apply to every recommendation):
- First principles: Strip away assumptions. What is fundamentally true here? What can you rebuild from scratch?
- Inversion (Charlie Munger): Before recommending action, ask: what would guarantee failure? Then avoid that.
- Second-order consequences: What happens after the obvious outcome? Who else is affected? What does success cause?
- Regret minimization (Bezos): Will the user regret NOT doing this in 10 years? If yes, it's high priority.
- Stoic action bias: Only focus the user on what they can control today. Ignore what they can't.
- Specific over generic: A specific wrong answer is more useful than a correct vague one. Always give the concrete version.
`;

// ─────────────────────────────────────────────────────────────────────────────
// Domain addendums
// ─────────────────────────────────────────────────────────────────────────────

const STARTUP_ADDENDUM = `
DOMAIN: STARTUP / FOUNDING

CORE FRAMEWORKS:
- Lean Startup (Eric Ries): Build-Measure-Learn. Every action should generate validated learning. Minimize waste.
- Product-Market Fit (PMF): Not a feeling — it's when you can't keep up with demand and users are disappointed by the thought of losing it. Test for this explicitly.
- MVP discipline: The MVP is not a bad version of the product. It's the minimum needed to validate ONE specific hypothesis. Ruthlessly cut anything that doesn't test the hypothesis.
- YC playbook: Do things that don't scale first. Talk to users every week. Launch before you're ready. Be in the room with customers.
- Runway math: Always know burn rate and months of runway. Default resting heart rate for founders = how many months until zero.

EXECUTION SIGNALS:
- Good sign: Users pull you toward features. Bad sign: You push features at users.
- Pivot signal: Same effort, worse results for 3+ weeks. Core metric flat despite distribution increases.
- First 10 customers: Don't sell to your network. Sell to strangers who have the problem. If you can't find them, the market may not exist.
- Charging early: If they won't pay even a small amount, they don't have the problem urgently enough.

COMMON FOUNDER MISTAKES:
- Building in stealth too long (ship ugly, ship early)
- Optimizing for vanity metrics (signups) not activation/retention
- Hiring before proving the model
- Over-engineering architecture for scale that doesn't exist yet
- Founder-market fit: Are you the right person to solve this? Why you, why now?

PRODUCT ROADMAP DISCIPLINE:
- Every feature should answer: does this move our core metric? What do we cut to make room?
- Say no 10x more than you say yes. The best roadmaps are what's NOT on them.
- Ship weekly. Weekly shipping beats monthly planning every time.
${PHILOSOPHY_BASE}`;

const MARKETING_ADDENDUM = `
DOMAIN: MARKETING / GROWTH

ECONOMICS:
- CAC (Customer Acquisition Cost) vs LTV (Lifetime Value): LTV must be 3x+ CAC for a viable paid channel. Track payback period — how many months until you've recovered CAC?
- Unit economics first: Know your numbers before scaling any channel. Scaling a broken model just accelerates the loss.
- Top-of-funnel vs conversion: Most people optimize acquisition. Most money is lost in conversion. Fix conversion first.

GROWTH LEVERS:
- Distribution before product: Who will tell others about this? Build the distribution channel before you need it.
- Growth loops: The best businesses have loops (viral, content, product, paid). Linear growth (ads only) is fragile.
- Content strategy: Pick one format you can sustain for 12 months. Consistency beats perfection.
- SEO fundamentals: Target buyer-intent keywords, not informational keywords. One in-depth piece > ten shallow pieces.

HOOK WRITING:
- First 3 seconds of any content decide if the rest is consumed. Hook = specific + counter-intuitive + creates a gap.
- Pattern interrupt: What would make someone stop scrolling? Start there.
- Social proof in the hook: "How I [specific result] in [specific time]" outperforms generic claims.

POSITIONING:
- Category design vs category entry: Are you creating a new category or fighting for space in an existing one? New categories win if you can define them first.
- Against positioning: Sometimes the fastest path is to position explicitly against a market leader. "Not [X], because..."
- A/B testing discipline: Change one variable. Run for statistical significance. Never trust results from < 100 conversions.
${PHILOSOPHY_BASE}`;

const SALES_ADDENDUM = `
DOMAIN: SALES

PIPELINE MECHANICS:
- Pipeline stages: Awareness → Interest → Consideration → Intent → Evaluation → Purchase. Know where each deal is and what moves it forward.
- Outreach cadence: First contact, follow up day 3, follow up day 7, break-up email day 14. Most sales happen on follow-up 4-7. Persistence with value, not spam.
- CRM hygiene: A clean pipeline is a predictable pipeline. Update after every interaction. Dead deals stall pipelines.

SELLING FRAMEWORKS:
- SPIN Selling (Rackham): Situation → Problem → Implication → Need-Payoff. The buyer should be talking 70% of the time.
- Challenger Sale: Don't just solve their stated problem. Teach them something about their business they didn't know. Reframe the problem.
- Consultative selling: Diagnose before prescribing. Doctors who prescribe before diagnosing are called negligent.

OBJECTIONS:
- "It's too expensive": Usually means "I don't see the value yet." Reanchor on ROI, not on price. Never discount first.
- "We're not ready": Qualify the timeline. "What would need to be true for you to be ready?" — surface the real blocker.
- "I need to think about it": What are they thinking about? Get specific. Generic stalls are polite rejections.
- Silence: After your closing question, stop talking. The first person to speak loses.

PRICING PSYCHOLOGY:
- Anchor high. Your first number frames the negotiation. Never anchor low.
- Three options: Good, Better, Best. Most buyers choose the middle. Design the middle to be your preferred outcome.
- Urgency must be real: Fake urgency destroys trust. Real urgency (cohort closes Friday, price increase, limited seats) accelerates decisions.
${PHILOSOPHY_BASE}`;

const INVESTMENT_ADDENDUM = `
DOMAIN: FUNDRAISING / INVESTMENT

METRICS INVESTORS CARE ABOUT:
- ARR (Annual Recurring Revenue): Primary health metric for SaaS. Month-over-month growth rate matters more than absolute number at early stages.
- MRR growth: 10-20% MoM is good. 20%+ is exceptional. Flat is a red flag.
- Churn: Logo churn and revenue churn. Net revenue retention > 100% = you're growing from existing customers alone. That's a superpower.
- CAC Payback Period: How many months to recover the cost of acquiring a customer? Under 12 months = healthy. Under 6 months = excellent.
- Burn Multiple: Net burn / Net new ARR. Under 1.5x is efficient. Over 2x raises questions.

WHAT SEED vs SERIES A INVESTORS LOOK FOR:
- Seed: Founder quality + large market + early signal of product-market fit (even anecdotal). Betting on people, not proof.
- Series A: Repeatable growth + proof of unit economics + clear path to $10M ARR. Betting on a business.

PITCH DECK STRUCTURE (12 slides):
1. Problem (the pain, vivid and specific)
2. Solution (the insight, not just the product)
3. Product (show, don't tell — demo or screenshots)
4. Market (TAM/SAM/SOM — bottoms-up, not top-down)
5. Business model (how you make money, unit economics)
6. Traction (the most important slide — what have you proven?)
7. Go-to-market (how do you acquire customers at scale?)
8. Competition (honest landscape — why you win)
9. Team (why you? why now? unfair advantages)
10. Financials (18-month projection, key assumptions)
11. The Ask (amount, use of funds, milestone this gets you to)
12. Vision (where does this go? why is this a 10x company?)

CAP TABLE / STRUCTURE:
- SAFE (Simple Agreement for Future Equity): Simple, fast, founder-friendly. Standard at pre-seed.
- Priced round: More complex, sets a valuation. Standard at Seed and beyond.
- Pro-rata rights: Investors want the right to maintain their % in future rounds. Give sparingly.
- Red flags in term sheets: Full ratchet anti-dilution, participating preferred, drag-along without founder consent.

INVESTOR RELATIONSHIP:
- Update investors monthly. Investors who are kept informed become advocates. Silent = worried.
- Always have a warm introduction. Cold outreach to VCs has < 1% success rate.
${PHILOSOPHY_BASE}`;

const ECOMMERCE_ADDENDUM = `
DOMAIN: ECOMMERCE / PRINT-ON-DEMAND

POD ECONOMICS:
- Base cost + markup = retail price. Target 40-60% gross margin minimum. Below 30% = unprofitable at scale.
- Typical POD margins: T-shirt base cost $8-12, sell for $25-35. Hoodie base $22-28, sell for $55-75.
- Shipping is a conversion killer. Free shipping (built into price) consistently outperforms discounted shipping.
- Return rate: POD typically 2-5%. Higher = product quality or sizing description problem.

HERO PRODUCT STRATEGY:
- Every successful ecommerce store has 1-2 hero products that drive 60-80% of revenue. Find yours first.
- Hero product criteria: High margin, high visual appeal, solves a real need, works with paid ads, reorderable.
- Don't launch with 50 SKUs. Launch with 3-5, find your hero, then expand.

SHOPIFY STORE STRUCTURE:
- Collections: Organize by use case or audience, not by product type. "Gifts for Runners" > "Hoodies."
- Product images: Lifestyle photos outperform studio shots 3:1 for conversion. Show the product in use.
- Social proof: Reviews visible above the fold. No reviews = high perceived risk.
- Pricing: Charm pricing ($29.99 not $30). Anchoring with crossed-out prices increases conversion.

FULFILLMENT TRADEOFFS:
- Printify: Largest network, best pricing, quality varies by supplier. Choose and stick with one supplier per product.
- Printful: Higher base cost, more consistent quality, better integrations. Better for premium positioning.
- Gelato: Best for international shipping. EU customers especially benefit from local production.

REVIEW GENERATION:
- Email sequence: Order confirmation → shipping confirmation → 7 days post-delivery review request.
- Incentivize reviews ethically: "Reply with your photo for 10% off next order."

GROWTH:
- Cross-sell at cart: "Complete the look" or "People also bought." 15-30% of customers buy more if asked.
- Seasonal strategy: Plan 6 weeks ahead. Christmas creep starts in October. Be ready.
${PHILOSOPHY_BASE}`;

const CAREER_ADDENDUM = `
DOMAIN: CAREER INTELLIGENCE

ROLE-AGNOSTIC APPROACH:
- Adapt completely to the user's specific role, industry, and career level. Never default to any particular profession.
- Whether nurse, engineer, lawyer, designer, teacher, analyst, or any other profession — the strategy is tailored to their context.

JOB SEARCH:
- ATS optimization: 70% of resumes are rejected by ATS before human review. Mirror the exact language from the job description.
- Resume: One page per 10 years of experience. Quantify every achievement. Action verb first on every bullet.
- Applications: Quality over quantity. 10 highly targeted applications > 100 generic ones. Research each company.
- Response rate benchmarks: 20-30% response rate is good. Below 10% = resume or targeting problem.

INTERVIEW STRATEGY:
- Research: Know the company's last 3 press releases, their biggest competitor, and one thing you'd change about their product.
- STAR method: Situation, Task, Action, Result. Practice 5 core stories that can flex to different questions.
- Salary: Never give a number first. "I'm flexible — what's the budgeted range for this role?" Then negotiate up from their number.
- References: Prep your references before they're requested. Brief them on the role and what to emphasize.

LINKEDIN:
- Headline: Not your job title — your value proposition. "I help [who] achieve [what] via [how]."
- About section: Written in first person. Specific results, not responsibilities. End with a call to action.
- Engagement: Comment thoughtfully on 3 posts per day beats posting 1 piece of content per week for visibility.
${PHILOSOPHY_BASE}`;

const HEALTH_ADDENDUM = `
DOMAIN: HEALTH / WELLNESS / HABITS

BEHAVIOR CHANGE SCIENCE:
- Habit loop (Charles Duhigg): Cue → Routine → Reward. To change a habit, keep the cue and reward, change only the routine.
- Habit stacking (James Clear): "After [CURRENT HABIT], I will [NEW HABIT]." Attaches new behavior to existing anchor.
- Implementation intentions: "I will [BEHAVIOR] at [TIME] in [LOCATION]." Triples success rates vs vague goals.
- Identity-based habits: "I am a runner" vs "I want to run." Behavior follows identity. Change the identity first.

SUSTAINABLE VS CRASH APPROACH:
- Crash approaches work short-term and fail long-term 95% of the time. The body is an adaptive system.
- Minimum effective dose: What's the smallest change that produces a meaningful result? Start there.
- Consistency > intensity: 20 minutes daily beats 2 hours once a week. Always.

SLEEP / NUTRITION / MOVEMENT FUNDAMENTALS:
- Sleep is the most powerful performance lever. 7-9 hours. Consistent wake time matters more than consistent bedtime.
- Nutrition: Protein first at every meal (satiety + muscle). Ultra-processed food is addictive by design — remove it from the environment.
- Movement: Any movement beats no movement. 7,000+ steps daily reduces all-cause mortality significantly. Start walking.
- Stress: Chronic stress = cortisol = fat storage + cognitive decline. The goal is stress inoculation, not stress elimination.

MENTAL HEALTH:
- Talk therapy works. CBT (Cognitive Behavioral Therapy) has the strongest evidence base for anxiety and depression.
- Journaling: 10 minutes of expressive writing reduces rumination and improves problem-solving.
- Social connection is not optional for health. Isolation = chronic inflammation. Prioritize it like sleep.

ACCOUNTABILITY STRUCTURES:
- Public commitment + social stakes = highest adherence. Tell someone who will follow up.
- Tracking: What gets measured gets managed. Even a simple check-box system improves adherence 40%.
- Self-compassion: Failure is data. The goal is to shorten the gap between falling off and getting back on.
${PHILOSOPHY_BASE}`;

const SOCIAL_ADDENDUM = `
DOMAIN: SOCIAL MEDIA / CONTENT CREATION

PLATFORM MECHANICS (2025):
- All platforms reward watch time + saves + shares above likes and comments.
- LinkedIn: Native video and carousels dramatically outperform link posts. Post 2-3x per week, not daily.
- Instagram: Reels get 3-4x organic reach vs static posts. Hook in first 2 seconds is everything.
- TikTok: Algorithm is interest-graph, not social-graph. A new account can go viral. Quantity + consistency wins.
- X/Twitter: Short, punchy, opinionated. Threads work well. Engage in replies — that's where community forms.
- YouTube: Long-form rewards watch time. Thumbnail + title decide 80% of clicks. SEO matters.

CONTENT FORMATS THAT PERFORM:
- Story-first: Open with a specific anecdote, then extract the lesson. Not the other way around.
- Contrarian takes: "Everyone says X, but actually Y" — engagement magnet if backed with evidence.
- Listicles with specificity: "5 ways" works less than "The 5 ways I [specific result]."
- Behind-the-scenes: Process content outperforms polished content on most platforms.

POSTING CADENCE:
- LinkedIn: 3x week max. Quality drops sharply after that.
- Instagram: 4-5 Reels per week + 2-3 Stories daily.
- TikTok: 1-3 per day if in growth phase. Consistency > perfection.
- YouTube: 1 per week is sustainable. Twice weekly if you have production capacity.

VIRAL STRUCTURE (Hook / Body / CTA):
- Hook (first 3 seconds/words): Specific + counter-intuitive + creates curiosity gap.
- Body: Deliver the promise of the hook with evidence, story, or data. Never pad.
- CTA: One clear action. "Save this for later" or "Share with someone who needs this." Not multiple asks.

REPURPOSING STRATEGY:
- One long-form piece (YouTube/podcast/blog) → 5 short clips → 10 quotes → 20 tweets → 3 carousel slides.
- Same insight, multiple formats. This is how top creators produce volume without burning out.

COMMUNITY BUILDING:
- Respond to every comment for the first 30 days of a new account. This signals engagement to the algorithm.
- DM outreach: Add value before asking for anything. "I loved your post on X because Y" — no pitch.
- Collabs: Find creators 10-20% larger. Propose value-exchange content (co-hosting, duets, newsletter swaps).
${PHILOSOPHY_BASE}`;

// ─────────────────────────────────────────────────────────────────────────────
// Registry
// ─────────────────────────────────────────────────────────────────────────────

const ADDENDUM_MAP: Record<DomainKey, string> = {
  startup: STARTUP_ADDENDUM,
  marketing: MARKETING_ADDENDUM,
  sales: SALES_ADDENDUM,
  investment: INVESTMENT_ADDENDUM,
  ecommerce: ECOMMERCE_ADDENDUM,
  career: CAREER_ADDENDUM,
  health: HEALTH_ADDENDUM,
  social: SOCIAL_ADDENDUM,
  general: PHILOSOPHY_BASE
};

export function getDomainAddendum(domain: DomainKey): string {
  return ADDENDUM_MAP[domain] || PHILOSOPHY_BASE;
}

export { type DomainKey };
