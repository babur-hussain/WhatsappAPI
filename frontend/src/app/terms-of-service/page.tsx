import React from 'react';

export const metadata = {
    title: 'Terms of Service | LoomiFlow',
    description: 'Terms of Service for LoomiFlow, WhatsApp API and CRM platform.',
};

export default function TermsOfService() {
    return (
        <div className="min-h-screen bg-gray-50/50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto bg-white p-8 sm:p-12 rounded-2xl shadow-sm border border-gray-100">
                <div className="mb-10 border-b border-gray-100 pb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">Terms of Service</h1>
                    <p className="text-gray-500">Last updated: April 16, 2026</p>
                </div>

                <div className="prose prose-gray max-w-none prose-headings:text-gray-900 prose-headings:-mt-2 prose-p:text-gray-600 prose-a:text-blue-600 hover:prose-a:text-blue-500">
                    <h2>1. Agreement to Terms</h2>
                    <p>
                        By accessing or using LoomiFlow ("the Service"), you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you may not access the Service. LoomiFlow provides a WhatsApp API CRM integration platform designed for businesses.
                    </p>

                    <h2>2. Use License</h2>
                    <p>
                        Permission is granted to temporarily download one copy of the materials (information or software) on LoomiFlow's website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
                    </p>
                    <ul className="list-disc pl-6 space-y-2 text-gray-600 mb-6">
                        <li>Modify or copy the materials.</li>
                        <li>Use the materials for any commercial purpose, or for any public display (commercial or non-commercial), without prior consent.</li>
                        <li>Attempt to decompile or reverse engineer any software contained on the LoomiFlow website or platform.</li>
                        <li>Remove any copyright or other proprietary notations from the materials.</li>
                        <li>Transfer the materials to another person or "mirror" the materials on any other server.</li>
                    </ul>

                    <h2>3. Meta and WhatsApp Policies</h2>
                    <p>
                        As a user of LoomiFlow integrating with the WhatsApp Cloud API, you agree to strictly comply with the WhatsApp Business Messaging Policy, WhatsApp Commerce Policy, and Meta's general Terms of Service. LoomiFlow is not responsible for your account being banned or restricted by Meta due to policy violations, spam, or promotional messaging abuse.
                    </p>

                    <h2>4. Service Availability & API Usage</h2>
                    <p>
                        We strive to ensure the highest uptime possible; however, LoomiFlow does not guarantee uninterrupted or error-free operation. We reserve the right to limit your API requests (rate limit) to prevent abuse and ensure stability for all customers across the platform. Excessive requests over an unreasonable timeframe may result in temporary suspension of API access.
                    </p>

                    <h2>5. User Data and Privacy</h2>
                    <p>
                        Your privacy is important to us. It is LoomiFlow's policy to respect your privacy regarding any information we may collect from you across our website and platform, and other sites we own and operate. Please refer to our Privacy Policy for more information on how we collect, use, and process your data.
                    </p>

                    <h2>6. Limitation of Liability</h2>
                    <p>
                        In no event shall LoomiFlow or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on LoomiFlow's website, even if LoomiFlow or a LoomiFlow authorized representative has been notified orally or in writing of the possibility of such damage.
                    </p>

                    <h2>7. Revisions and Errata</h2>
                    <p>
                        The materials appearing on LoomiFlow's website could include technical, typographical, or photographic errors. LoomiFlow does not warrant that any of the materials on its website are accurate, complete, or current. LoomiFlow may make changes to the materials contained on its website at any time without notice.
                    </p>

                    <h2>8. Governing Law</h2>
                    <p>
                        These terms and conditions are governed by and construed in accordance with the laws, and you irrevocably submit to the exclusive jurisdiction of the courts in that State or location.
                    </p>

                    <h2>9. Modifications</h2>
                    <p>
                        LoomiFlow may revise these terms of service for its website at any time without notice. By using this website you are agreeing to be bound by the then current version of these terms of service.
                    </p>

                    <h2>10. Contact Us</h2>
                    <p>
                        If you have any questions about these Terms, please contact us at support@lfvs.in.
                    </p>
                </div>
            </div>
        </div>
    );
}
