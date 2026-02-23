import Link from 'next/link';

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-black text-white p-8 md:p-16">
            <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
                <header>
                    <Link href="/" className="text-indigo-400 hover:underline text-sm mb-4 inline-block">&larr; Back to Home</Link>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">Terms of Service</h1>
                    <p className="text-zinc-400">Last Updated: February 2026</p>
                </header>

                <section className="space-y-4 text-zinc-300">
                    <h2 className="text-2xl font-semibold text-white">1. Agreement to Terms</h2>
                    <p>By using CubiQo, you agree to these Terms. Do not use our service if you disagree with any part of it.</p>

                    <h2 className="text-2xl font-semibold text-white">2. Prohibited AI Queries</h2>
                    <p>You may not use CubiQo to facilitate illegal activities, generate harmful content, or deploy automated scraping engines strictly for commercial abuse. We reserve the right to throttle usage limits.</p>

                    <h2 className="text-2xl font-semibold text-white">3. Disclaimers</h2>
                    <p>CubiQo's voice engine and logic routing (Red, Green, Yellow) are provided "AS IS". We are not responsible if the model hallucinates information or errs on action fulfillment.</p>

                    <h2 className="text-2xl font-semibold text-white">4. Changes to Terms</h2>
                    <p>We may amend these terms at any time. Continued usage constitutes acceptance.</p>
                </section>
            </div>
        </div>
    );
}
