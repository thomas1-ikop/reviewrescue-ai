/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import Logo from './Logo';

export default function PrivacyPolicy() {
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
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Privacy Policy</h1>
          <p className="text-sm text-slate-500 mb-8">Last Updated: June 16, 2026</p>

          <div className="prose prose-slate max-w-none space-y-6 text-sm text-slate-700 leading-relaxed">
            <h2 className="text-lg font-bold text-slate-900 mt-6">1. Introduction</h2>
            <p>
              Rewakely ("we," "our," or "us") respects your privacy and is committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our software-as-a-service platform (the "Service").
            </p>
            <p>
              By using our Service, you agree to the collection and use of information in accordance with this Privacy Policy.
            </p>

            <h2 className="text-lg font-bold text-slate-900 mt-6">2. Information We Collect</h2>
            <h3 className="font-semibold text-slate-900">2.1 Information You Provide to Us</h3>
            <p>When you create an account and use our Service, we collect:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Account Information:</strong> Name, email address, business name, industry, password</li>
              <li><strong>Business Profile:</strong> Business name, industry, tone preferences, contact email for unhappy customers</li>
              <li><strong>Review Data:</strong> Customer names, review comments, ratings, review sources (Google, Yelp, etc.)</li>
              <li><strong>AI-Generated Content:</strong> AI-generated replies to reviews</li>
              <li><strong>Communication:</strong> Messages sent through our contact form or support channels</li>
              <li><strong>Payment Information:</strong> Billing details processed by Stripe (we do not store full payment card information)</li>
            </ul>

            <h3 className="font-semibold text-slate-900">2.2 Information Collected Automatically</h3>
            <p>When you use our Service, we may automatically collect:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Usage Data:</strong> Pages visited, features used, time spent</li>
              <li><strong>Device Information:</strong> IP address, browser type, operating system</li>
              <li><strong>Cookies:</strong> Session cookies to keep you logged in</li>
            </ul>

            <h2 className="text-lg font-bold text-slate-900 mt-6">3. How We Use Your Information</h2>
            <p>We use your information to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Provide and maintain the Service</li>
              <li>Generate AI replies to customer reviews (your review data is processed per request and is not used to train our AI models)</li>
              <li>Send SMS invites to your customers (via our SMS provider)</li>
              <li>Process payments (via Stripe)</li>
              <li>Communicate with you about your account, updates, and support</li>
              <li>Improve our Service and user experience</li>
              <li>Comply with legal obligations</li>
            </ul>

            <h2 className="text-lg font-bold text-slate-900 mt-6">4. Sharing Your Information</h2>
            <p>We may share your information with third-party service providers who assist us in operating our Service:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Supabase</strong> – database and authentication</li>
              <li><strong>Stripe</strong> – payment processing</li>
              <li><strong>Resend</strong> – email delivery</li>
              <li><strong>Twilio / SignalHouse</strong> – SMS delivery</li>
              <li><strong>Google</strong> – Google Business Profile API integration (for auto-reply feature)</li>
            </ul>
            <p>These third parties have access to your personal information only to perform specific tasks on our behalf and are obligated not to disclose or use it for any other purpose.</p>

            <h2 className="text-lg font-bold text-slate-900 mt-6">5. Data Retention</h2>
            <p>We retain your personal information only for as long as necessary to fulfill the purposes outlined in this Privacy Policy:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Account data</strong> – retained while your account is active</li>
              <li><strong>Review data and AI-generated replies</strong> – retained for 30 days after account termination</li>
              <li><strong>Usage data</strong> – retained for analytics purposes (anonymized where possible)</li>
            </ul>
            <p>You may request deletion of your data at any time by contacting us.</p>

            <h2 className="text-lg font-bold text-slate-900 mt-6">6. Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.
            </p>

            <h2 className="text-lg font-bold text-slate-900 mt-6">7. Your Rights</h2>
            <p>Depending on your location, you may have the following rights regarding your personal information:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Access</strong> – request a copy of your data</li>
              <li><strong>Rectification</strong> – correct inaccurate data</li>
              <li><strong>Deletion</strong> – request deletion of your data</li>
              <li><strong>Restriction</strong> – limit how we use your data</li>
              <li><strong>Portability</strong> – receive your data in a portable format</li>
              <li><strong>Opt-Out</strong> – opt out of marketing communications</li>
            </ul>
            <p>
              To exercise any of these rights, please contact us at <strong>contact.rescuereview@gmail.com</strong>.
            </p>

            <h2 className="text-lg font-bold text-slate-900 mt-6">8. California Privacy Rights (CCPA)</h2>
            <p>If you are a California resident, you have the right to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Know what personal information we collect about you</li>
              <li>Request deletion of your personal information</li>
              <li>Opt out of the sale of your personal information (we do not sell your data)</li>
              <li>Not be discriminated against for exercising your rights</li>
            </ul>

            <h2 className="text-lg font-bold text-slate-900 mt-6">9. Children's Privacy</h2>
            <p>
              Our Service is not directed at children under the age of 13. We do not knowingly collect personal information from children under 13. If you become aware that a child has provided us with personal information, please contact us.
            </p>

            <h2 className="text-lg font-bold text-slate-900 mt-6">10. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.
            </p>

         

<h2 className="text-lg font-bold text-slate-900 mt-6">12. SMS Communications</h2>

<p>
  When you use Rewakely to send SMS review invites to your customers, we process phone numbers solely for the purpose of delivering those invitations.
</p>

<h3 className="font-semibold text-slate-900 mt-4">What We Do With Phone Numbers:</h3>
<ul className="list-disc pl-6 space-y-1">
  <li><strong>Usage:</strong> Phone numbers are used exclusively to send SMS review invitations on your behalf.</li>
  <li><strong>Sharing:</strong> We do not share, sell, or rent phone numbers to third parties.</li>
  <li><strong>Storage:</strong> Phone numbers are stored securely and encrypted.</li>
  <li><strong>Retention:</strong> Phone numbers are retained only as long as necessary to deliver the SMS service and for compliance purposes.</li>
</ul>

<h3 className="font-semibold text-slate-900 mt-4">Your Responsibility:</h3>
<p>
  You are responsible for obtaining proper consent from your customers before sending SMS messages through Rewakely. We recommend including an opt-in checkbox on your customer intake forms and providing clear opt-out instructions in all SMS communications.
</p>

<h3 className="font-semibold text-slate-900 mt-4">Opt-Out:</h3>
<p>
  All SMS messages sent through Rewakely include instructions for recipients to opt out by replying "STOP." We respect all opt-out requests and will not send further messages to opted-out numbers.
</p>

   <h2 className="text-lg font-bold text-slate-900 mt-6">11. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at <strong>contact.rescuereview@gmail.com</strong>.
            </p>

          </div>
        </div>
      </div>
    </div>
  );
}