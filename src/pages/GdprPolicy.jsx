import { useEffect } from 'react';
import { Link } from 'react-router';
import { CONTACT, ORG, GDPR } from '../utils/constants';

export default function GdprPolicy() {
  useEffect(() => {
    document.title = 'GDPR Policy | Greenwich Parents & Carers';
  }, []);

  return (
    <main className="max-w-3xl mx-auto px-4 py-16 md:py-24">
      <h1 className="font-heading text-3xl md:text-4xl font-bold text-dark mb-2">
        Data Protection (GDPR) Policy
      </h1>
      <p className="text-gray-500 text-sm mb-10">
        Approved: July 2024
      </p>

      <div className="prose prose-sm md:prose-base max-w-none text-gray-700 space-y-6">
        <section>
          <h2 className="font-heading font-bold text-dark text-xl mb-2">Introduction</h2>
          <p>
            {ORG.name} ({ORG.shortName}) is a Community Interest Company
            (Company No. {ORG.cicNumber}) and a volunteer-run community group for
            parents and carers of young families in Greenwich, London. We are
            committed to complying with the UK General Data Protection Regulation
            (UK-GDPR) and the Data Protection Act 2018.
          </p>
          <p>
            The Data Controller for {ORG.shortName} is {GDPR.dataController}. This
            policy sets out how we collect, use, store, and protect personal data,
            proportionate to the nature and scale of data we hold.
          </p>
        </section>

        <section>
          <h2 className="font-heading font-bold text-dark text-xl mb-2">GDPR Principles</h2>
          <p>We process all personal data in accordance with the six GDPR principles. Personal data must be:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Lawfulness, fairness, and transparency</strong> — processed lawfully, fairly, and in a transparent manner.</li>
            <li><strong>Purpose limitation</strong> — collected for specified, explicit, and legitimate purposes only.</li>
            <li><strong>Data minimisation</strong> — adequate, relevant, and limited to what is necessary.</li>
            <li><strong>Accuracy</strong> — accurate and, where necessary, kept up to date.</li>
            <li><strong>Storage limitation</strong> — kept only for as long as is necessary.</li>
            <li><strong>Integrity and confidentiality</strong> — processed with appropriate security measures in place.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-heading font-bold text-dark text-xl mb-2">Lawful Basis for Processing</h2>
          <p>We process personal data under the following lawful bases:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Consent</strong> — when you subscribe to our newsletter or opt in to receive information about {ORG.shortName} activities and areas of interest.</li>
            <li><strong>Contract</strong> — when processing details of goods or services purchased, including payment information.</li>
            <li><strong>Legal obligation</strong> — for example, sharing tax or payroll information with HM Revenue &amp; Customs where required.</li>
            <li><strong>Legitimate interests</strong> — to maintain contact information for volunteers and administrators for operational purposes such as organising meetings and activities.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-heading font-bold text-dark text-xl mb-2">Your Rights</h2>
          <p>Under the UK-GDPR, you have the right to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Be informed</strong> — know how your data is being used through clear privacy notices.</li>
            <li><strong>Access</strong> — request a copy of the personal data we hold about you.</li>
            <li><strong>Rectification</strong> — ask us to correct inaccurate or incomplete data.</li>
            <li><strong>Erasure</strong> — request deletion of your data (subject to legal obligations).</li>
            <li><strong>Restrict processing</strong> — ask us to limit how we use your data.</li>
            <li><strong>Data portability</strong> — receive your data in a structured, machine-readable format.</li>
            <li><strong>Object</strong> — object to the processing of your data in certain circumstances.</li>
            <li><strong>Automated decision-making</strong> — not be subject to decisions based solely on automated processing.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-heading font-bold text-dark text-xl mb-2">Data Retention</h2>
          <p>
            We only retain personal data for as long as necessary for the purpose
            it was collected. Our retention practices are reviewed every six months.
            When data is no longer needed, it is securely deleted within 20 working
            days.
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Data held by consent — retained for the period the individual has consented to.</li>
            <li>Data held by legitimate interest — retained for the period the interest applies.</li>
            <li>Data held by legal obligation — retained for the period legally required.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-heading font-bold text-dark text-xl mb-2">Data Sharing &amp; Third Parties</h2>
          <p>
            We do not share personal data with third parties except where strictly
            necessary and unavoidable. Where sharing is required, data subjects are
            informed in advance wherever possible.
          </p>
          <p>
            Any third party processing data on our behalf is bound by written
            contract to process data only per our instructions, use industry-standard
            security practices, and securely delete data after the purpose is
            complete. No data is transferred outside the UK without appropriate
            safeguards.
          </p>
        </section>

        <section>
          <h2 className="font-heading font-bold text-dark text-xl mb-2">Data Breaches</h2>
          <p>
            In the event of a data breach, we will notify the Information
            Commissioner&apos;s Office (ICO) immediately and provide full details as
            soon as they are available. Affected individuals will be informed where
            the breach poses a high risk to their rights and freedoms.
          </p>
        </section>

        <section>
          <h2 className="font-heading font-bold text-dark text-xl mb-2">Contact</h2>
          <p>
            If you have any questions about this policy or would like to exercise
            your data protection rights, please email us at{' '}
            <a
              href={`mailto:${CONTACT.email}`}
              className="text-primary hover:underline"
            >
              {CONTACT.email}
            </a>
            .
          </p>
          <p>
            You also have the right to lodge a complaint with the{' '}
            <a
              href="https://ico.org.uk/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Information Commissioner&apos;s Office (ICO)
            </a>
            .
          </p>
        </section>

        <section className="border-t border-gray-200 pt-6">
          <p className="text-sm text-gray-500">
            See also our{' '}
            <Link to="/privacy" className="text-primary hover:underline">Website Privacy Policy</Link>
            {' '}and{' '}
            <Link to="/safeguarding-policy" className="text-primary hover:underline">Safeguarding Policy</Link>.
          </p>
        </section>
      </div>
    </main>
  );
}
