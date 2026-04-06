import { useEffect } from 'react';
import { Link } from 'react-router';
import { ORG, SAFEGUARDING } from '../utils/constants';

export default function SafeguardingPolicy() {
  useEffect(() => {
    document.title = 'Safeguarding Policy | Greenwich Parents & Carers';
  }, []);

  return (
    <main className="max-w-3xl mx-auto px-4 py-16 md:py-24">
      <h1 className="font-heading text-3xl md:text-4xl font-bold text-dark mb-2">
        Safeguarding Policy
      </h1>
      <p className="text-gray-500 text-sm mb-10">
        Approved: June 2024
      </p>

      <div className="prose prose-sm md:prose-base max-w-none text-gray-700 space-y-6">
        <section>
          <h2 className="font-heading font-bold text-dark text-xl mb-2">Introduction &amp; Purpose</h2>
          <p>
            {ORG.name} ({ORG.shortName}) recognises its duty of care to safeguard
            and promote the welfare of children and young people. The welfare of the
            child is paramount in all decisions and actions taken by the organisation.
          </p>
          <p>
            All children have an equal right to protection from harm regardless of
            age, disability, gender reassignment, race, religion or belief, sex, or
            sexual orientation. Some children are additionally vulnerable due to
            previous experiences, level of dependency, communication needs, or other
            factors.
          </p>
          <p>
            This policy reflects our statutory responsibilities, government guidance,
            and recognised best practice. It applies to all paid staff, volunteers,
            and anyone working on behalf of {ORG.shortName}. Non-compliance will be
            addressed without delay and may result in dismissal or exclusion from the
            organisation.
          </p>
        </section>

        <section>
          <h2 className="font-heading font-bold text-dark text-xl mb-2">Scope</h2>
          <p>
            This policy covers the safeguarding of all children and young people
            (anyone under 18) receiving {ORG.shortName} services, including children
            of adult service users. It also extends to adults at risk — people with
            care and support needs who may be experiencing, or at risk of, abuse or
            neglect.
          </p>
        </section>

        <section>
          <h2 className="font-heading font-bold text-dark text-xl mb-2">Definitions</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Child</strong> — anyone under 18 years of age, as defined by the Children Act 1989.</li>
            <li><strong>Adult at risk</strong> — a person with care and support needs who is experiencing, or at risk of, abuse or neglect and is unable to protect themselves.</li>
            <li><strong>Abuse</strong> — includes physical abuse, emotional abuse, sexual abuse, neglect, bullying and cyberbullying, child sexual and criminal exploitation, trafficking, domestic abuse, female genital mutilation, grooming, and online abuse.</li>
          </ul>
        </section>

        <section>
          <h2 className="font-heading font-bold text-dark text-xl mb-2">Roles &amp; Responsibilities</h2>
          <p>
            <strong>Senior Lead for Safeguarding:</strong>{' '}
            {SAFEGUARDING.seniorLead.name} —{' '}
            <a href={`mailto:${SAFEGUARDING.seniorLead.email}`} className="text-primary hover:underline">
              {SAFEGUARDING.seniorLead.email}
            </a>
            {' '}/ {SAFEGUARDING.seniorLead.phone}
          </p>
          <p>
            <strong>Deputy Senior Lead for Safeguarding:</strong>{' '}
            {SAFEGUARDING.deputyLead.name} —{' '}
            <a href={`mailto:${SAFEGUARDING.deputyLead.email}`} className="text-primary hover:underline">
              {SAFEGUARDING.deputyLead.email}
            </a>
          </p>
          <p>
            All staff and volunteers have a responsibility to recognise concerns,
            record them appropriately, and report them to the Senior Lead for
            Safeguarding.
          </p>
        </section>

        <section>
          <h2 className="font-heading font-bold text-dark text-xl mb-2">Responding to Concerns</h2>
          <p>If you have a safeguarding concern:</p>
          <ol className="list-decimal pl-6 space-y-1">
            <li><strong>Listen</strong> carefully to the child or person raising the concern. Do not ask leading questions or promise confidentiality.</li>
            <li><strong>Do not investigate</strong> — this is the role of the statutory authorities.</li>
            <li><strong>Record</strong> the details as soon as possible, including who was involved, the nature of the concern, any actions taken, and decisions made with reasoning.</li>
            <li><strong>Report</strong> the concern to the Senior Lead for Safeguarding immediately.</li>
          </ol>
          <p>
            All records must be signed, dated, and stored securely in accordance
            with data protection requirements.
          </p>
        </section>

        <section>
          <h2 className="font-heading font-bold text-dark text-xl mb-2">Confidentiality &amp; Record Keeping</h2>
          <p>
            All staff and volunteers must maintain confidentiality. Information is
            shared only on a need-to-know basis and in accordance with GDPR and the
            Data Protection Act 2018.
          </p>
          <p>
            <strong>Exception:</strong> Information will be shared with the Local
            Authority if a child is at risk of harm, or with the Police if a child
            is in immediate danger or a crime has been committed.
          </p>
        </section>

        <section>
          <h2 className="font-heading font-bold text-dark text-xl mb-2">Training</h2>
          <p>
            All paid staff, volunteers, and contractors receive an appropriate level
            of safeguarding training. As a minimum, this training enables them to
            understand safeguarding and their role within it, recognise children who
            may need safeguarding, know how to report a concern, and understand
            dignity and respect when working with children.
          </p>
        </section>

        <section>
          <h2 className="font-heading font-bold text-dark text-xl mb-2">Safe Recruitment</h2>
          <p>
            {ORG.shortName} is committed to safe employment and recruitment
            practices to reduce the risk of unsuitable people working with or having
            contact with children and young people.
          </p>
        </section>

        <section>
          <h2 className="font-heading font-bold text-dark text-xl mb-2">Social Media &amp; Photography</h2>
          <p>
            No photos, videos, images, or recordings of children receiving{' '}
            {ORG.shortName} services that identify a child may be uploaded to social
            media or any other platform without the explicit consent of the person
            with parental responsibility. It is unlawful to photograph or record
            children without this consent.
          </p>
        </section>

        <section>
          <h2 className="font-heading font-bold text-dark text-xl mb-2">Whistleblowing</h2>
          <p>
            {ORG.shortName} encourages all staff and volunteers to speak up about
            any dangerous, illegal, or wrongful activity, including concerns about
            the behaviour of other staff members or volunteers. The organisation
            protects whistleblowers from retaliation.
          </p>
        </section>

        <section>
          <h2 className="font-heading font-bold text-dark text-xl mb-2">Emergency Contacts</h2>
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 not-prose">
            <h3 className="font-heading font-bold text-dark text-lg mb-4">If a child is in immediate danger</h3>
            <ul className="space-y-3 text-gray-700">
              <li>
                <strong>Police (emergency):</strong>{' '}
                <a href="tel:999" className="text-primary font-semibold hover:underline">999</a>
              </li>
              <li>
                <strong>Police (non-emergency):</strong>{' '}
                <a href="tel:101" className="text-primary font-semibold hover:underline">101</a>
              </li>
              <li>
                <strong>NSPCC Helpline:</strong>{' '}
                <a href="tel:08088005000" className="text-primary font-semibold hover:underline">0808 800 5000</a>
              </li>
              <li>
                <strong>Senior Lead ({SAFEGUARDING.seniorLead.name}):</strong>{' '}
                <a href={`tel:${SAFEGUARDING.seniorLead.phone}`} className="text-primary font-semibold hover:underline">
                  {SAFEGUARDING.seniorLead.phone}
                </a>
              </li>
            </ul>
          </div>
        </section>

        <section className="border-t border-gray-200 pt-6">
          <p className="text-sm text-gray-500">
            See also our{' '}
            <Link to="/privacy" className="text-primary hover:underline">Website Privacy Policy</Link>
            {' '}and{' '}
            <Link to="/gdpr-policy" className="text-primary hover:underline">GDPR Policy</Link>.
          </p>
        </section>
      </div>
    </main>
  );
}
