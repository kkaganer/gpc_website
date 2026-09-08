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
  Mail,
  Radar,
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

// The line between "during the week" and "the fifteen minutes on Friday". Steps 1
// and 2 can happen any time; everything below this runs in order, in one sitting.
function DayBreak({ children }) {
  return (
    <div className="flex gap-4">
      <div className="shrink-0 w-9 flex justify-center">
        <div className="w-px h-full bg-gray-200" />
      </div>
      <div className="pb-8 pt-1 min-w-0">
        <div className="font-bold text-[11px] uppercase tracking-[0.08em] text-[#d1067f]">
          {children}
        </div>
      </div>
    </div>
  )
}

function Shortcut({ children, label = 'Shortcut: paste the email', icon: Icon = Mail }) {
  return (
    <div className="border border-dashed border-primary/40 rounded-xl px-4 py-3 bg-[#fff5fb]">
      <div className="font-bold text-[11px] uppercase tracking-wider text-[#d1067f] flex items-center gap-1.5">
        <Icon size={13} /> {label}
      </div>
      <div className="text-sm text-gray-700 leading-relaxed mt-1.5 space-y-2">{children}</div>
    </div>
  )
}

export default function Help() {
  return (
    <div className="max-w-3xl">
      <h1 className="font-heading text-2xl font-bold text-dark">How to send the newsletter</h1>
      <p className="text-sm text-gray-600 mt-2 leading-relaxed">
        Steps 1 and 2 happen during the week. The rest is about fifteen minutes on Friday
        morning, and it runs strictly in order — generating takes a snapshot of whatever is in the
        system at that moment, so anything you fix afterwards means generating again.
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
          <Shortcut label="Shortcut: run the scraper" icon={Radar}>
            <p>
              Discovery pulls events in from open listings feeds. You can start it from{' '}
              <strong>two</strong> places — <strong>Run discovery</strong> on the Discovery screen,
              or <strong>Discover Events</strong> on What&rsquo;s On. They are the same run, not
              two different ones, so there is no reason to do both.
            </p>
            <p>
              <strong>Wherever you start it, the results end up in Discovery.</strong> Nothing goes
              straight into What&rsquo;s On, which is why starting it from What&rsquo;s On gives
              you a &ldquo;Review discovered&rdquo; link instead of just refreshing the list in
              front of you. Approving on the Discovery screen is what publishes an event into
              What&rsquo;s On.
            </p>
            <p>
              It works through the feeds one at a time and the counter shows how many are done. If
              it finishes with &ldquo;still running server-side&rdquo;, that is the page giving up
              on waiting, not the run failing — it carries on without you, and the results appear
              under Discovery shortly after.
            </p>
          </Shortcut>
          <Shortcut>
            <p>
              When an organiser emails asking to be featured, you do not have to retype it. On
              What&rsquo;s On press <strong>Parse Email</strong> — the box that opens is titled
              &ldquo;Parse Organiser Email&rdquo; — paste the whole email, signature and all, and
              it creates the events for you.
            </p>
            <p>
              They arrive as <strong>Pending</strong>, in the same review tab you already use —
              nothing is published without you approving it. A run with a start and end date
              becomes <em>one</em> event covering the whole run, not one per day.
            </p>
            <p>
              Read the <strong>skipped</strong> list it shows you afterwards. Skipped rows were{' '}
              <em>not</em> created, and the usual reason is an event whose date has already passed
              — nearly always because the email did not say the year and it guessed wrong. If a
              skipped one is real, add it by hand with the right date.
            </p>
          </Shortcut>
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
            presenting slot at the top, <strong>Logo sponsor</strong> is a tile in the supporter
            row, and <strong>Free listing</strong> is a sales record only — a free listing appears
            in the guide because somebody added it under{' '}
            <Link to="/admin/whats-on" className="text-[#d1067f] font-semibold hover:underline">What&rsquo;s On</Link>,
            not because of the row here.
          </p>
          <p>
            The email holds <strong>one</strong> presenting card. Sell two for the same Friday and
            only the first prints — the Newsletter screen says so next to the date, but nothing
            else will.
          </p>
          <Shortcut>
            <p>
              Advertiser enquiries can be pasted too: on Advertisers press{' '}
              <strong>Parse Email</strong> and paste the thread. It creates one row per event
              mentioned.
            </p>
            <p>
              <strong>Everything it creates still needs editing before it will appear.</strong>{' '}
              Parsed rows are always saved as <strong>Free listing</strong> and{' '}
              <strong>Pending</strong>, whatever the email actually asked for — so a business that
              has paid for the top slot will be sitting there as an unpaid pending listing until
              you set the ad type and status yourself.
            </p>
            <p>
              It also <em>guesses</em> the newsletter date: it reads a date from the email if there
              is one, and otherwise falls back to the next upcoming Friday. Check it against what
              the advertiser actually booked.
            </p>
          </Shortcut>
          <Note tone="warn">
            <AlertTriangle size={15} className="inline mr-1.5 -mt-0.5" />
            This is the step that goes wrong most often, and it fails <em>silently</em>. A
            mistyped date or a status left on Pending does not cause an error — the newsletter
            generates perfectly and simply leaves that advertiser out. If a paying advertiser is
            missing from the draft, check these two fields first.
          </Note>
        </Step>

        <DayBreak>Friday morning, in order</DayBreak>

        <Step n={3} title="Open this week's page and read it" icon={Globe}>
          <p>
            Every edition has its own page at{' '}
            <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">
              gpccommunity.co.uk/whats-on/YYYY-MM-DD
            </code>{' '}
            using the same Friday date. Open it before you generate anything.
          </p>
          <p>
            It comes first because both the email and the WhatsApp message point here, so wrong
            here is wrong everywhere — and because it is built from the events and advertisers you
            set up in steps 1 and 2, it shows you whether those landed before you take a snapshot
            of them.
          </p>
          <p>
            It is <em>not</em> a preview of the email. The email carries five picks; this page
            carries the lot.
          </p>
          <p className="font-semibold text-dark">
            Before moving on: the events look right, and any paying advertiser you tagged is
            showing.
          </p>
        </Step>

        <Step n={4} title="Generate the draft" icon={Sparkles}>
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
            so if you regenerate after a fix, delete the older one straight away.
          </p>
          <p className="font-semibold text-dark">
            Before moving on: one draft for this week, and the booked-slot line above the Generate
            button matches what you expected to sell.
          </p>
        </Step>

        <Step n={5} title="Read it, and edit if needed" icon={Pencil}>
          <p>
            Press <strong>Edit</strong> on the draft to open the section editor. Drag a block by
            its handle to move it, click <strong>ON/OFF</strong> to hide it without deleting it, or
            press the bin to remove it for good. Clicking any text in the preview jumps to the
            field that produced it. Read it as a subscriber would — that is the only proofreading
            step there is.
          </p>
          <p>
            The email is deliberately short: the presenting card, five picks, and the button
            through to the full guide. <strong>This week&rsquo;s picks</strong> takes the first
            five matching events — reorder or swap them there, and change{' '}
            <strong>Show at most</strong> if a week wants more. Everything else is on the web page
            the button links to.
          </p>
          <p>
            An unsold <em>presenting</em> slot is not a bug: it renders as GPC&rsquo;s own
            &ldquo;this space&rdquo; invitation at the same size, which is intended. The supporter
            row behaves differently — with no logos sold it is left out of the email altogether,
            so a quiet week has one invitation in it rather than two.
          </p>
          <p>
            A block with a paid booking behind it is marked <strong>£</strong> in the sidebar, and
            switching one off warns you. Removing it takes that advertiser out of the edition they
            paid for.
          </p>
          <p className="font-semibold text-dark">
            Before moving on: you have read it end to end, and the number on the button matches the
            page you opened at step 3.
          </p>
        </Step>

        <Step n={6} title="Copy the HTML and send it from Brevo" icon={Copy}>
          <p>
            Press <strong>Copy HTML</strong> on the draft, then paste it into a Brevo campaign as
            the message body and send it to the subscriber list.
          </p>
          <p>
            Send yourself a test first. Three things only a test can show you: the{' '}
            <strong>See all N events</strong> button goes to this week&rsquo;s page, one pick link
            opens the right event, and <strong>Unsubscribe</strong> is a working link rather than
            the words <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">
              {'{{ unsubscribe }}'}
            </code>{' '}
            printed on the page. That last one is the provider substituting its own tag, and it can
            only be checked in a real send.
          </p>
          <p className="font-semibold text-dark">
            Before moving on: the test arrived and those three things are right.
          </p>
          <Note tone="warn">
            <AlertTriangle size={15} className="inline mr-1.5 -mt-0.5" />
            <strong>Nothing in this admin sends email.</strong> Brevo holds a copy of the
            subscriber list for sending; Supabase is the source of truth. The send happens in
            Brevo and nowhere else.
          </Note>
        </Step>

        <Step n={7} title="Post the WhatsApp message" icon={MessageCircle}>
          <p>
            Press <strong>Copy WhatsApp text</strong> and paste it into the group. It is generated
            from the same draft, kept under WhatsApp&rsquo;s length limit, and ends with the link
            to that week&rsquo;s page.
          </p>
          <p>
            This comes after the email, not before — by now you know the send worked and you have
            read the page it points at. It is not that the link goes live when you send: the page
            is live as soon as the events are approved, which is why you could open it back at
            step 3.
          </p>
          <p>
            WhatsApp supports only <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">*bold*</code>{' '}
            and <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">_italic_</code>, so the
            text is deliberately plain. Do not paste the HTML there.
          </p>
          <p className="font-semibold text-dark">
            Before moving on: the link in the posted message opens this week&rsquo;s page.
          </p>
          <Note>
            <strong>There is no PDF, and there never was one.</strong> Nothing in this admin
            produces a PDF — the guide exists as an email, a WhatsApp message and a web page, and
            all three point at the same page. If you have been printing the email to a PDF to
            share, post the link instead: it stays correct when details change, its booking links
            work, and clicks on paid slots are counted where a PDF&rsquo;s are not.
          </Note>
        </Step>

        <Step n={8} title="Mark it as sent" icon={CheckCircle2}>
          <p>
            Back on <Link to="/admin/newsletter" className="text-[#d1067f] font-semibold hover:underline">Newsletter</Link>,
            press <strong>Mark as sent</strong> on the draft.
          </p>
          <p>
            This only changes the label. It sends nothing — it is how you and anybody else can tell
            next week which draft actually went out, which matters because generating twice leaves
            two drafts sitting there looking identical.
          </p>
          <p className="font-semibold text-dark">
            Before moving on: exactly one draft for this week is marked sent, and any spare
            regenerated drafts are deleted.
          </p>
        </Step>

        <Step n={9} title="Report clicks back to advertisers" icon={MousePointerClick}>
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
            <dt className="font-semibold text-dark">
              A parsed advertiser is not in the newsletter
            </dt>
            <dd className="text-gray-600 leading-relaxed mt-1">
              Expected: the parser saves everything as Free listing / Pending, and Pending never
              appears. Open the row, set the real ad type and set the status to Confirmed.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-dark">
              I ran discovery from What&rsquo;s On and nothing appeared there
            </dt>
            <dd className="text-gray-600 leading-relaxed mt-1">
              Working as intended. Discovery always lands in the Discovery review queue no matter
              which screen you started it from — nothing is ever published straight into
              What&rsquo;s On. Approve it under Discovery and it appears.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-dark">
              The email parser skipped something, or found nothing
            </dt>
            <dd className="text-gray-600 leading-relaxed mt-1">
              Skipped rows are listed with a reason and were not created — most often the date has
              already passed because the year was guessed wrong. Both parsers read the text you
              paste, so include the whole email; a forwarded fragment with the dates trimmed off
              gives it nothing to work with. Parsing uses an outside service, so &ldquo;failed to
              parse&rdquo; can also mean that service is briefly down — retrying is worth one go
              before typing it in by hand.
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
