import Link from 'next/link';

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-black text-white p-8 md:p-16">
            <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
                <header>
                    <Link href="/" className="text-indigo-400 hover:underline text-sm mb-4 inline-block">&larr; Back to Home</Link>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Privacy Policy</h1>
                    <p className="text-zinc-400">Last Updated: February 2026</p>
                </header>

                <section className="space-y-4 text-zinc-300">
                    <h2 className="text-2xl font-semibold text-white">1. Introduction</h2>
                    <p>At CubiQo, your privacy is our supreme priority. We run a voice-first, private AI assistant designed to act as your digital secretary. We do not use your personal conversations to train global AI models, and we do not store your data for any length of time beyond what is strictly necessary to route your intent.</p>

                    <h2 className="text-2xl font-semibold text-white">2. Data We Collect</h2>
                    <p>We specifically minimize data collection. When you create an account, we collect your email address. During active conversations, our backend momentarily processes your audio and text to determine intent, but we do not persist conversational memory permanently without explicit confirmation.</p>

                    <h2 className="text-2xl font-semibold text-white">3. How We Use Data</h2>
                    <p>We use your transient data exclusively to provide CubiQo's core routing architecture (the Red, Green, Yellow intents). We do not mine your interactions for ad targeting.</p>

                    <h2 className="text-2xl font-semibold text-white">4. Your GDPR & CCPA Rights</h2>
                    <p>You have the absolute right to be forgotten. Inside your account settings, you will find a "Delete My Account & All Data" button. Executing this permanently and irreversibly purges your identity, preferences, and any transient state from our core databases (Supabase).</p>
                </section>
            </div>
        </div>
    );
}
