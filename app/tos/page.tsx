import React from 'react';

export default function TermsOfService() {
    return (
        <div className="max-w-4xl mx-auto px-6 py-20 font-sans text-gray-800 dark:text-gray-200">
            <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
            <p className="text-sm text-gray-500 mb-8">Last Updated: February 23, 2026</p>

            <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
                <p className="mb-4">
                    By accessing or using CubiQo ("the Service"), you agree to be bound by these Terms of Service.
                    The Service is provided by CubiQo AI. If you do not agree to these terms, please do not use the Service.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
                <p className="mb-4">
                    CubiQo is an AI-powered personal assistant and social network that utilizes ambient intelligence,
                    RGY (Red, Yellow, Green) zone categorization for memories and matches, and voice interaction.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">3. Privacy and Data</h2>
                <p className="mb-4">
                    Your privacy is important to us. Our Privacy Policy explains how we collect and use your information.
                    By using CubiQo, you consent to the processing of your data as described in the Privacy Policy.
                    We implement industry-standard encryption and offer GDPR-compliant data export and deletion tools.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">4. User Conduct</h2>
                <p className="mb-4">
                    You agree not to use the Service for any unlawful purpose or in any way that violates the rights of others.
                    Abusive, threatening, or harmful behavior within the social network layers is strictly prohibited.
                </p>
            </section>

            <section className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">5. Limitation of Liability</h2>
                <p className="mb-4">
                    CubiQo is provided "as is" without warranties of any kind. We are not liable for any damages
                    arising from your use of the Service.
                </p>
            </section>

            <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-800">
                <a href="/" className="text-blue-500 hover:underline">Return to App</a>
            </div>
        </div>
    );
}
