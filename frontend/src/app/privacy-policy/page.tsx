import React from 'react';

export const metadata = {
  title: 'Privacy Policy | LoomiFlow',
  description: 'Privacy Policy for LoomiFlow, WhatsApp API and CRM platform.',
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50/50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white p-8 sm:p-12 rounded-2xl shadow-sm border border-gray-100">
        <div className="mb-10 border-b border-gray-100 pb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 tracking-tight">Privacy Policy</h1>
          <p className="text-gray-500">Last updated: April 16, 2026</p>
        </div>

        <div className="prose prose-gray max-w-none prose-headings:text-gray-900 prose-headings:-mt-2 prose-p:text-gray-600 prose-a:text-blue-600 hover:prose-a:text-blue-500">
          <h2>1. Introduction</h2>
          <p>
            Welcome to LoomiFlow ("we", "our", or "us"). We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you about how we look after your personal data when you visit our website or use our WhatsApp CRM Platform and API services, and tell you about your privacy rights and how the law protects you.
          </p>

          <h2>2. The Data We Collect About You</h2>
          <p>We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:</p>
          <ul className="list-disc pl-6 space-y-2 text-gray-600 mb-6">
            <li><strong>Identity Data</strong> includes first name, last name, username or similar identifier.</li>
            <li><strong>Contact Data</strong> includes billing address, email address and telephone numbers.</li>
            <li><strong>Communication Data</strong> includes the content of messages sent through our WhatsApp integration, which are processed momentarily to facilitate the service.</li>
            <li><strong>Technical Data</strong> includes internet protocol (IP) address, your login data, browser type and version, time zone setting and location.</li>
          </ul>

          <h2>3. How We Use Your Personal Data</h2>
          <p>We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:</p>
          <ul className="list-disc pl-6 space-y-2 text-gray-600 mb-6">
            <li>Where we need to perform the contract we are about to enter into or have entered into with you (e.g., providing WhatsApp CRM functionality).</li>
            <li>Where it is necessary for our legitimate interests and your interests and fundamental rights do not override those interests.</li>
            <li>Where we need to comply with a legal obligation.</li>
          </ul>

          <h2>4. WhatsApp Data Processing</h2>
          <p>
            As a platform utilizing the Meta/WhatsApp Cloud API, we process messages and contacts on your behalf. We act as a data processor for the communication data that flows through our systems. We do not use your end-customers' data for our own marketing purposes or sell it to third parties. Our handling of this data strictly complies with Meta's developer policies and applicable data protection laws.
          </p>

          <h2>5. Data Security</h2>
          <p>
            We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used, or accessed in an unauthorized way, altered, or disclosed. In addition, we limit access to your personal data to those employees, agents, contractors, and other third parties who have a business need to know.
          </p>

          <h2>6. Data Retention</h2>
          <p>
            We will only retain your personal data for as long as reasonably necessary to fulfill the purposes we collected it for, including for the purposes of satisfying any legal, regulatory, tax, accounting, or reporting requirements.
          </p>

          <h2>7. Your Legal Rights</h2>
          <p>Under certain circumstances, you have rights under data protection laws in relation to your personal data, including the right to:</p>
          <ul className="list-disc pl-6 space-y-2 text-gray-600 mb-6">
            <li>Request access to your personal data.</li>
            <li>Request correction of your personal data.</li>
            <li>Request erasure of your personal data.</li>
            <li>Object to processing of your personal data.</li>
            <li>Request restriction of processing your personal data.</li>
            <li>Request transfer of your personal data.</li>
            <li>Right to withdraw consent.</li>
          </ul>

          <h2>8. Contact Us</h2>
          <p>
            If you have any questions about this privacy policy or our privacy practices, please contact us at support@lfvs.in.
          </p>
        </div>
      </div>
    </div>
  );
}
