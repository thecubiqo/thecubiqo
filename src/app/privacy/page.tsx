import { AppLayout } from '@/components/AppLayout'

export default function PrivacyPage() {
    return (
        <AppLayout>
            <div className="max-w-4xl mx-auto p-8 text-white/80 space-y-8">
                <h1 className="text-4xl font-bold text-white mb-2">Privacy Policy</h1>
                <p className="text-sm text-white/50">Last Updated: February 2026</p>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">1. Data Collection & Storage</h2>
                    <p>Your conversation routing is private and not logged. Your conscious memories are stored with your consent and deletable any time.</p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">2. AI Processing via Third-Parties</h2>
                    <p>Requests may be processed by OpenAI, Anthropic, ElevenLabs, and other LLM providers. In BYO Mode, requests are processed using your own API keys which are encrypted client-side using AES-256-GCM.</p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">3. Third-party Platforms & Social Army</h2>
                    <p>Integration with platforms like LinkedIn, Instagram, and Twitter using Social Army may share content directly with those platforms pursuant to their respective terms.</p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">4. Your Rights (GDPR & CCPA)</h2>
                    <p>You have the right to access, rectify, or delete your personal data. You can exercise these options in your account settings or contact support.</p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-2xl font-semibold text-white">5. Age Restrictions</h2>
                    <p>Users under 13 are prohibited. Uses of explicit capabilities (RED Zone) require age verification (18+).</p>
                </section>
            </div>
        </AppLayout>
    )
}
