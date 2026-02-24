import React from 'react';

export default function PrivacyPolicy() {
    return (
        <div className="max-w-4xl mx-auto px-6 py-20 font-sans text-gray-800 dark:text-gray-200">
            <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
            <p className="text-sm text-gray-500 mb-8">Last Updated: February 23, 2026</p>

            <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>
                <p className="mb-4">
                    CubiQo collects information you provide directly (such as email, preferences, and journal entries)
                    and information generated through AI interaction (memories, personality traits).
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">2. How We Use Information</h2>
                <p className="mb-4">
                    We use your data to power the personal AI experience, suggest relevant connections in the RGY network,
                    and improve our machine learning models. We do NOT sell your personal data to third parties.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">3. Data Retention and Erasure</h2>
                <p className="mb-4">
                    We retain your data as long as your account is active. You have the right to request a full export
                    of your data or the permanent deletion of your account at any time via the Settings panel.
                </p>
                <p className="mb-4 text-sm bg-blue-500/10 p-4 rounded-lg border border-blue-500/20">
                    <strong>GDPR Compliance:</strong> CubiQo adheres to GDPR principles including the Right to Access,
                    the Right to Erasure, and Data Portability.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">4. Security</h2>
                <p className="mb-4">
                    We use industry-standard security measures including SSL/TLS encryption and secure hashing
                    to protect your personal information.
                </p>
            </section>

            <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
                <a href="/" className="text-blue-500 hover:underline">Return to App</a>
            </div>
        </div>
    );
}
