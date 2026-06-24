/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import Logo from './Logo';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Header with Logo and Back Button */}
        <div className="flex items-center justify-between mb-8">
          <Logo />
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              window.location.href = '/';
            }}
            className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition"
          >
            ← Back to Home
          </a>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-8 md:p-12 shadow-sm">
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Terms of Service</h1>
          <p className="text-sm text-slate-500 mb-8">Last Updated: June 16, 2026</p>

          <div className="prose prose-slate max-w-none space-y-6 text-sm text-slate-700 leading-relaxed">
            <h2 className="text-lg font-bold text-slate-900 mt-6">1. Acceptance of Terms</h2>
            <p>
              By accessing or using the Rewakely Service (the "Service"), you agree to be bound by these Terms of Service (the "Terms"). If you do not agree to these Terms, you may not access or use the Service.
            </p>

            <h2 className="text-lg font-bold text-slate-900 mt-6">2. Description of Service</h2>
            <p>Rewakely is an AI-powered review management tool that helps businesses:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Generate AI replies to customer reviews</li>
              <li>Send SMS invitations to customers asking for reviews</li>
              <li>Automatically reply to positive Google reviews (via Google Business Profile API)</li>
              <li>Manage and track review responses</li>
            </ul>

            <h2 className="text-lg font-bold text-slate-900 mt-6">3. Account Registration</h2>
            <p>To use the Service, you must:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Be at least 18 years old</li>
              <li>Provide accurate and complete registration information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
            </ul>
            <p>You are responsible for all activities that occur under your account.</p>

            <h2 className="text-lg font-bold text-slate-900 mt-6">4. Subscription and Billing</h2>
            <h3 className="font-semibold text-slate-900">4.1 Subscription Plans</h3>
            <p>
              The Service is offered on a subscription basis. The current plan is the <strong>Pro Plan</strong> at $49/month (USD) or €49/month (EUR), which includes unlimited AI replies, SMS invites, and auto-reply features.
            </p>

            <h3 className="font-semibold text-slate-900">4.2 Billing</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Payments are processed through Stripe</li>
              <li>Subscriptions are billed monthly in advance</li>
              <li>You authorize us to charge your payment method on the same day each month</li>
              <li>All fees are non-refundable except as required by law</li>
            </ul>

            <h3 className="font-semibold text-slate-900">4.3 Automatic Renewal</h3>
            <p>
              Your subscription will automatically renew at the end of each billing period unless you cancel before the renewal date. You can cancel at any time through the Stripe Customer Portal or by contacting us.
            </p>

            <h3 className="font-semibold text-slate-900">4.4 Free Trial</h3>
            <p>
              We may offer a free trial period at our discretion. If you do not cancel before the trial ends, your subscription will automatically convert to a paid plan.
            </p>

            <h2 className="text-lg font-bold text-slate-900 mt-6">5. Cancellation and Refunds</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>You may cancel your subscription at any time through the Stripe Customer Portal</li>
              <li>Upon cancellation, your account will remain active until the end of the current billing period</li>
              <li>No refunds will be provided for partial months</li>
              <li>If you cancel, your data may be retained for 30 days before permanent deletion</li>
            </ul>

            <h2 className="text-lg font-bold text-slate-900 mt-6">6. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Use the Service for any unlawful purpose</li>
              <li>Impersonate any person or entity</li>
              <li>Interfere with or disrupt the Service</li>
              <li>Access the Service through unauthorized means</li>
              <li>Use the Service to send spam or unsolicited messages</li>
              <li>Use the Service to harass, abuse, or harm others</li>
              <li>Violate any applicable laws or regulations</li>
            </ul>

            <h2 className="text-lg font-bold text-slate-900 mt-6">7. Content Ownership</h2>
            <h3 className="font-semibold text-slate-900">7.1 Your Content</h3>
            <p>
              You retain ownership of any content you submit to the Service (reviews, customer data, etc.). By submitting content, you grant us a limited license to process it for the purpose of providing the Service.
            </p>

            <h3 className="font-semibold text-slate-900">7.2 AI-Generated Content</h3>
            <p>
              AI-generated replies are created based on your content and are considered your content. We do not claim ownership of AI-generated replies.
            </p>

            <h3 className="font-semibold text-slate-900">7.3 Our Intellectual Property</h3>
            <p>
              The Service, including its software, design, and branding, is owned by Rewakely and is protected by copyright and other intellectual property laws.
            </p>

            <h2 className="text-lg font-bold text-slate-900 mt-6">8. Google Business Profile API</h2>
            <p>If you use the Google Business Profile API auto-reply feature, you agree to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Comply with Google's Terms of Service and API policies</li>
              <li>Only connect Google Business Profiles that you own or are authorized to manage</li>
              <li>Not use the feature in a way that violates Google's policies</li>
            </ul>

            <h2 className="text-lg font-bold text-slate-900 mt-6">9. Limitation of Liability</h2>
            <p>To the maximum extent permitted by law:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>The Service is provided "as is" and "as available"</li>
              <li>We make no warranties, express or implied, about the Service</li>
              <li>We are not liable for any indirect, incidental, special, consequential, or punitive damages</li>
              <li>Our total liability is limited to the amount you paid us in the 12 months preceding the claim</li>
            </ul>

            <h2 className="text-lg font-bold text-slate-900 mt-6">10. Disclaimer of Warranties</h2>
            <p>We do not warrant that:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>The Service will be uninterrupted or error-free</li>
              <li>The results obtained from the Service will be accurate or reliable</li>
              <li>Any errors in the Service will be corrected</li>
            </ul>

            <h2 className="text-lg font-bold text-slate-900 mt-6">11. Indemnification</h2>
            <p>
              You agree to indemnify and hold Rewakely harmless from any claims, damages, losses, liabilities, costs, or expenses arising from:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Your use of the Service</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any third-party rights</li>
            </ul>

            <h2 className="text-lg font-bold text-slate-900 mt-6">12. Termination</h2>
            <p>
              We may terminate or suspend your account at our sole discretion without notice if you violate these Terms. Upon termination, your right to use the Service will immediately cease.
            </p>

            <h2 className="text-lg font-bold text-slate-900 mt-6">13. Governing Law</h2>
            <p>
              These Terms are governed by the laws of the State of Georgia, USA, without regard to its conflict of law provisions.
            </p>

            <h2 className="text-lg font-bold text-slate-900 mt-6">14. Dispute Resolution</h2>
            <p>
              Any dispute arising from these Terms shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association. The arbitration shall take place in Georgia, USA.
            </p>

            <h2 className="text-lg font-bold text-slate-900 mt-6">15. Changes to Terms</h2>
            <p>
              We may update these Terms from time to time. We will notify you of any material changes by email or by posting a notice on the Service. Your continued use of the Service constitutes acceptance of the updated Terms.
            </p>

            <h2 className="text-lg font-bold text-slate-900 mt-6">16. Contact Us</h2>
            <p>
              If you have any questions about these Terms, please contact us at <strong>contact@rewakely.com</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}