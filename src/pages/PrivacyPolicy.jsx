import { useEffect } from 'react';
import { CONTACT, ORG } from '../utils/constants';

export default function PrivacyPolicy() {
  useEffect(() => {
    document.title = 'Privacy Policy | Greenwich Parents & Carers';
  }, []);

  return (
    <main className="max-w-3xl mx-auto px-4 py-16 md:py-24">
      <h1 className="font-heading text-3xl md:text-4xl font-bold text-dark mb-2">
        Privacy Policy
      </h1>
      <p className="text-gray-500 text-sm mb-10">
        Last updated: {new Date().getFullYear()}
      </p>

      <div className="prose prose-sm md:prose-base max-w-none text-gray-700 space-y-6">
        <section>
          <h2 className="font-heading font-bold text-dark text-xl mb-2">Introduction</h2>
          <p>
            {ORG.name} ({ORG.shortName}) is a Community Interest Company
            (Company No. {ORG.cicNumber}) committed to protecting your privacy. This
            policy explains what personal information we collect, how we use it,
            and your rights under the UK GDPR and Data Protection Act 2018.
          </p>
        </section>

        <section>
          <h2 className="font-heading font-bold text-dark text-xl mb-2">What we collect</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Your email address when you subscribe to our newsletter.</li>
            <li>Your name and contact details if you book an event or contact us directly.</li>
            <li>Basic analytics about how visitors use the site (pages visited, device type).</li>
          </ul>
        </section>

        <section>
          <h2 className="font-heading font-bold text-dark text-xl mb-2">How we use your information</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>To send you our weekly newsletter (only if you have opted in).</li>
            <li>To manage event bookings and communicate about events you have signed up for.</li>
            <li>To improve the website and understand what our community finds useful.</li>
          </ul>
          <p className="mt-2">
            We will never sell your personal data. We only share it with the
            third-party services listed below where strictly necessary to run
            the community.
          </p>
        </section>

        <section>
          <h2 className="font-heading font-bold text-dark text-xl mb-2">Third parties</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Supabase</strong> - stores event and website data.</li>
            <li><strong>Brevo (Sendinblue)</strong> - sends our newsletter.</li>
            <li><strong>Eventbrite / ticketing partners</strong> - processes event bookings where used.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-heading font-bold text-dark text-xl mb-2">Your rights</h2>
          <p>You have the right to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Request a copy of the personal data we hold about you.</li>
            <li>Ask us to correct or delete your data.</li>
            <li>Withdraw consent and unsubscribe from our newsletter at any time.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-heading font-bold text-dark text-xl mb-2">Contact</h2>
          <p>
            If you have any questions about this policy or would like to exercise
            your rights, please email us at{' '}
            <a
              href={`mailto:${CONTACT.email}`}
              className="text-primary hover:underline"
            >
              {CONTACT.email}
            </a>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
