# CubiQo Monetization Strategy: The "Credit + Army" Model

Since your AI burns GPU time and the Social Army generates thousands of videos, we must use a **Consumption-Capped Subscription** model.

## 1. Consumer Tiers (B2C)
| Tier | Price | Features |
| :--- | :--- | :--- |
| **Free** | $0/mo | • 50 Free Messages/Day<br>• Access to Default Cube<br>• No Voice Mode |
| **Pro** | $29/mo | • **Unlimited** Messages<br>• **Voice Mode** (10 Hours)<br>• Prioritized Access (Fast)<br>• 5 Custom Agent Slots |
| **Lifetime** | $399 | • One-time Purchase (Pro Features Forever) |

## 2. Business Tiers (The Social Army)
This is where the real revenue/cost is. Video generation and 100-account management is expensive.

| Tier | Price | Features |
| :--- | :--- | :--- |
| **Commander** | $499/mo | • **10 Social Accounts**<br>• 1,000 Auto-Generated Posts/Mo<br>• Basic GFX Template Access |
| **General** | $1,999/mo | • **100 Social Accounts** (Full Deployment)<br>• **Unlimited** Posts<br>• Dedicated VPS Infrastructure<br>• Custom Branding/Personas |

## 3. Implementation Plan
1.  **Database**: Add `subscriptions` table (linked to Stripe Customer ID).
2.  **Credit System**: Add `user_credits` table (for video generation limits).
3.  **Gateways**:
    *   **Stripe**: Recurring billing.
    *   **Supabase Auth**: Check `subscription_status` before allowing Social Army creation.

## 4. Immediate Action
I will implement the **Database Schema** first to support this structure.
Then I will add the **Pricing UI**.
