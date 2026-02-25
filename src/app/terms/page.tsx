import { AppLayout } from '@/components/AppLayout'

export default function TermsPage() {
    return (
        <AppLayout>
            <div className="max-w-4xl mx-auto p-8 text-white/80 space-y-8">
                <h1 className="text-4xl font-bold text-white mb-2">Terms of Service</h1>
                <p className="text-sm text-white/50">Last Updated: February 2026</p>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">1. AI Output Disclaimer</h2>
                    <p>AI-generated content may be inaccurate. Not a substitute for professional advice.</p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">2. Voice Recording Disclosure</h2>
                    <p>Voice data is processed by ElevenLabs and OpenAI. Not stored on Cubiqo servers.</p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">3. BYO API Key Liability Limitation</h2>
                    <p>User-provided API keys are encrypted client-side. Cubiqo bears no liability for third-party API costs incurred through BYO keys.</p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">4. Social Army Terms of Service Compliance</h2>
                    <p>Users must comply with LinkedIn, Twitter/X, and Instagram terms. Account bans resulting from Social Army automation are the user's sole responsibility.</p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">5. Mental Health Disclaimer</h2>
                    <p>Cubiqo is not a mental health service. Journal contents are not monitored by clinicians. If in crisis, contact 988 (US) / 1-833-456-4566 (CA).</p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">6. Data Retention</h2>
                    <p>User data retained for 30 days after account deletion. Journey Memory data deleted immediately on opt-out.</p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">7. Limitation of Liability</h2>
                    <p>Cubiqo's maximum liability is limited to the amount paid in the 3 months preceding the claim.</p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">8. Governing Law</h2>
                    <p>Ontario, Canada law governs. Disputes resolved by binding arbitration.</p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">9. Subscription & Refund Policy</h2>
                    <p>Monthly subscriptions cancel at period end. No refunds for partial months. Lifetime plans: 30-day full refund, no refunds after 30 days.</p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">10. Age Requirement</h2>
                    <p>Users must be 13+ (16+ for EU residents under GDPR). No accounts for minors. 18+ required for uncensored RED zone.</p>
                </section>
            </div>
        </AppLayout>
    )
}
