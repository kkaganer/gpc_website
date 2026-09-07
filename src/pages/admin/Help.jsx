import { Link } from 'react-router'
import {
  Megaphone,
  Sparkles,
  Pencil,
  Copy,
  MessageCircle,
  CheckCircle2,
  AlertTriangle,
  MousePointerClick,
  Globe,
} from 'lucide-react'

// The how-to for running a newsletter week.
//
// Written for whoever is doing the job at 8am on a Friday, not for whoever
// built it. Every step names the screen it happens on and what you should see
// when it worked, because the failure most likely to bite -- an advertiser
// tagged with the wrong date, or left on Pending -- is silent: the newsletter
// generates perfectly and just leaves them out.

function Step({ n, title, icon: Icon, children }) {
  return (
    <div className="flex gap-4">
      <div className="shrink-0 flex flex-col items-center">
        <div className="w-9 h-9 rounded-full bg-primary text-white font-bold text-sm flex items-center justify-center">
          {n}
        </div>
        <div className="w-px flex-1 bg-gray-200 mt-2" />
      </div>
      <div className="pb-8 min-w-0">
        <h3 className="font-heading font-bold text-dark flex items-center gap-2">
          {Icon && <Icon size={17} className="text-primary shrink-0" />}
          {title}
        </h3>
        <div className="text-sm text-gray-600 leading-relaxed mt-2 space-y-2">{children}</div>
      </div>
    </div>
  )
}

function Note({ children, tone = 'info' }) {
  const tones = {
    info: 'bg-warm border-gray-200 text-gray-700',
    warn: 'bg-amber-50 border-amber-200 text-amber-900',
  }
  return (
    <div className={`border rounded-xl px-4 py-3 text-sm leading-relaxed ${tones[tone]}`}>
      {children}
    </div>
  )
}

export default function Help() {
  return (
    <div className="max-w-3xl">
      <h1 className="font-heading text-2xl font-bold text-dark">How to send the newsletter</h1>
      <p className="text-sm text-gray-600 mt-2 leading-relaxed">
        Start to finish, this takes about fifteen minutes. Do it in order — steps 1 and 2 have to
        happen <em>before</em> you generate, because generating takes a snapshot of whatever is in
        the system at that moment.
      </p>

      <div className="mt-8">
        <Step n={1} title="Check the week's events are in and approved" icon={CheckCircle2}>
          <p>
            Go to <Link to="/admin/whats-on" className="text-[#d1067f] font-semibold hover:underline">What&rsquo;s On</Link>.
            Only events marked <strong>approved</strong> are eligible. Anything still sitting in{' '}
            <Link to="/admin/discovery" className="text-[#d1067f] font-semibold hover:underline">Discovery</Link>{' '}
            has not been published yet — approve there first and it lands in What&rsquo;s On.
          </p>
          <p>
            A multi-week run (a theatre run, an exhibition) appears in every edition it spans, not
            just the week it opened. That is deliberate — you do not need to re-add it.
          </p>
        </Step>

        <Step n={2} title="Tag this week's advertisers" icon={Megaphone}>
          <p>
            Go to <Link to="/admin/newsletter-advertisers" className="text-[#d1067f] font-semibold hover:underline">Advertisers</Link>.
            For each one appearing this week, two fields decide whether they show up at all:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Newsletter date</strong> must be the <em>exact</em> Friday you are about to
              generate. Not the day you booked them, not the Monday of that week.
            </li>
            <li>
              <strong>Status</strong> must be <strong>Confirmed</strong> or <strong>Included</strong>.
              Pending does not appear anywhere.
            </li>
          </ul>
          <p>
            <strong>Ad type</strong> decides the placement: <strong>Featured ad</strong> is the
            presenting slot at the top, <strong>Logo sponsor</strong> is the supporter tile, and{' '}
            <strong>Free listing</strong> appears as an ordinary line in the list like any other
            event.
          </p>
          <Note tone="warn">
            <AlertTriangle size={15} className="inline mr-1.5 -mt-0.5" />
            This is the step that goes wrong most often, and it fails <em>silently</em>. A
            mistyped date or a status left on Pending does not cause an error — the newsletter
            generates perfectly and simply leaves that advertiser out. If a paying advertiser is
            missing from the draft, check these two fields first.
          </Note>
        </Step>

        <Step n={3} title="Generate the draft" icon={Sparkles}>
          <p>
            Go to <Link to="/admin/newsletter" className="text-[#d1067f] font-semibold hover:underline">Newsletter</Link>.
            Write the intro message, set <strong>Newsletter week of</strong> to the Friday, and
            press <strong>Generate newsletter</strong>.
          </p>
          <p>
            It pulls the approved events for that window, matches the advertisers you tagged in
            step 2, and saves a draft below. It sends nothing to anybody.
          </p>
          <p>
            Generating again makes an <em>additional</em> draft rather than replacing the last one,
            so if you regenerate after a fix, delete the older one to avoid sending the wrong copy.
          </p>
        </Step>

        <Step n={4} title="Read it, and edit if needed" icon={Pencil}>
          <p>
            Press <strong>Edit</strong> on the draft to open the section editor, where you can
            reorder, disable or reword blocks and save. Read it as a subscriber would — that is the
            only proofreading step there is.
          </p>
          <p>
            An unsold advertising slot is not a bug: it renders as GPC&rsquo;s own &ldquo;this
            space&rdquo; invitation at the same size, which is intended.
          </p>
        </Step>

        <Step n={5} title="Copy the HTML into Brevo and send" icon={Copy}>
          <p>
            Press <strong>Copy HTML</strong>, then paste it into a Brevo campaign and send from
            there.
          </p>
          <Note tone="warn">
            <AlertTriangle size={15} className="inline mr-1.5 -mt-0.5" />
            <strong>Nothing in this admin sends email.</strong> Brevo holds a copy of the
            subscriber list for sending; Supabase is the source of truth. Pressing{' '}
            <strong>Mark as sent</strong> here only changes the label on the draft — it is a note
            to yourself, not a send.
          </Note>
        </Step>

        <Step n={6} title="Post the WhatsApp message" icon={MessageCircle}>
          <p>
            Press <strong>Copy WhatsApp text</strong> and paste it into the group. It is generated
            from the same draft, kept under WhatsApp&rsquo;s length limit, and ends with the link
            to that week&rsquo;s page on the website.
          </p>
          <p>
            WhatsApp supports only <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">*bold*</code>{' '}
            and <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">_italic_</code>, so the
            text is deliberately plain. Do not paste the HTML there.
          </p>
        </Step>

        <Step n={7} title="Check the web page" icon={Globe}>
          <p>
            Every edition has its own page at{' '}
            <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">
              gpccommunity.co.uk/whats-on/YYYY-MM-DD
            </code>{' '}
            using the same Friday date. That is the link the email and WhatsApp message point at,
            and the one people share.
          </p>
          <p>
            Open it once before you send. It shows the same events and advertisers as the email, so
            if something looks wrong there it is wrong in the email too.
          </p>
        </Step>

        <Step n={8} title="Report clicks back to advertisers" icon={MousePointerClick}>
          <p>
            The <strong>Advertiser clicks</strong> panel on the Newsletter screen shows counts for
            the week currently selected in <strong>Newsletter week of</strong>, split by email and
            web. That is the weekly number promised to paying advertisers.
          </p>
          <p>
            Counts only exist for paid slots, because only those link through the counter. Free
            listings are not tracked, by design.
          </p>
        </Step>
      </div>

      <div className="border-t border-gray-200 pt-6 mt-2">
        <h2 className="font-heading font-bold text-dark">When something looks wrong</h2>
        <dl className="mt-4 space-y-4 text-sm">
          <div>
            <dt className="font-semibold text-dark">An advertiser is missing from the draft</dt>
            <dd className="text-gray-600 leading-relaxed mt-1">
              Almost always step 2: the newsletter date is not the exact Friday, or the status is
              still Pending. Fix it, delete the draft, and generate again.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-dark">
              &ldquo;Failed to generate newsletter&rdquo;
            </dt>
            <dd className="text-gray-600 leading-relaxed mt-1">
              The generate step runs on a Supabase edge function. If it has not been deployed since
              the last change, this is the error you get. It is a developer fix, not something you
              can correct from here.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-dark">An event is missing</dt>
            <dd className="text-gray-600 leading-relaxed mt-1">
              Check it is approved in What&rsquo;s On and that its date falls in the week. An event
              already listed in an earlier section of the same newsletter will not be repeated in a
              later one — that is intentional, to stop the same run printing twice.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-dark">The week&rsquo;s page says nothing is listed</dt>
            <dd className="text-gray-600 leading-relaxed mt-1">
              No approved events fall in that window. A quiet week shows a proper message rather
              than an empty page, so this is working as intended — but it is worth checking the date
              in the URL is the Friday you meant.
            </dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
