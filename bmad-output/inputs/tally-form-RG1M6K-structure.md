# Source Form Analysis — Tally `RG1M6K`

**"Welcome to the GPC Mums in Business & Work Community!"**
Extracted from the live form definition (`__NEXT_DATA__` block payload), 2026-08-18.
153 blocks. This is the ground truth for field parity in the replacement form.

## Branching model

One branch key: **`Which group would you like to join?`** (single choice, required).
Three `CONDITIONAL_LOGIC` blocks fire `SHOW_BLOCKS` off it:

| Answer | Reveals |
|---|---|
| **Business Mums** | Business branch (7 question groups) |
| **Career Mums** | Career branch (4 question groups) |
| **Both** | Business branch **+** Career branch (all 11 groups) |

Everything else on the form is unconditional. All branch fields are `isHidden: true` until the branch fires.

## Full field inventory, in order

### Always shown — identity
| # | Question | Type | Req |
|---|---|---|---|
| 1 | What's your first name? | text | ✅ |
| 2 | What's your email address | email | ✅ |
| 3 | What's your postcode? | text | ✅ |
| 4 | How did you hear about us? | single choice | ✅ |
| | *Greenwich Parents & Carers · Weekly Newletter [sic] · Instagram · Friend · Event · Google · Other* | | |
| 5 | **Which group would you like to join?** ← branch key | single choice | ✅ |
| | *Business Mums · Career Mums · Both* | | |

### Conditional — "Business Questions" (Business Mums, or Both)
| # | Question | Type | Req |
|---|---|---|---|
| B1 | What stage best describes your business? | single choice | ✅ |
| | *I want to get inspired · I'm exploring a business idea · I'm preparing to launch · I've recently launched · I'm growing my business · I run an established business* | | |
| B2 | Which industry are you in? | text | ✅ |
| B3 | Business name | text | ❌ |
| B4 | Website | url | ❌ |
| B5 | Instagram | url | ❌ |
| B6 | What are you currently looking for? | multi-select | ✅ |
| | *Networking · New clients · Collaborations · Marketing & Social Media · AI & Automation · Personal Branding · Business Strategy · Finance & Funding · Accounting & Tax · Legal · HR & Employment · Hiring Staff · Childcare & Work-Life Balance · Insurance · Business Workshops · Mentoring · Accountability · Other* | | |
| B7 | What challenges are you currently facing? | long text | ✅ |

### Conditional — "Career Questions" (Career Mums, or Both)
| # | Question | Type | Req |
|---|---|---|---|
| C1 | Which best describes your current situation? | multi-select | ✅ |
| | *Looking for work · Employed full-time · Employed part-time · Self-employed · Freelance · Returning after maternity leave · Returning after a career break · **Looking for work** (duplicate) · Exploring a career change · Student · Other* | | |
| C2 | What industry do you work in? | text | ✅ |
| C3 | What type of support would be most valuable to you? | multi-select | ✅ |
| | *CV Review · LinkedIn · Interview Skills · Networking · Career Coaching · Confidence Building · Personal Branding · AI Skills · Leadership · Flexible Working · Returning after Maternity · Financial Planning · Pension Advice · Tax · Mentoring · Other* | | |
| C4 | What is your biggest career challenge right now? | long text | ✅ |

### Always shown — "Events"
| # | Question | Type | Req |
|---|---|---|---|
| 6 | What kinds of events would you love to attend? | multi-select (10) | ✅ |
| | *Networking breakfasts · Evening networking · Guest speakers · Workshops · Business masterclasses · Career talks · Co-working sessions · Family-friendly events · Wellness sessions · Social meet-ups* | | |
| 7 | Which days usually work best for you? | multi-select (21 = 7 days × 3 slots) | ✅ |
| 8 | How often would you like events? | multi-select ⚠️ (renders as checkboxes, not radio) | ✅ |
| | *Weekly · Fortnightly · Monthly · Quarterly* | | |

### Always shown — "Community & Involvement"
| # | Question | Type | Req |
|---|---|---|---|
| 9 | What do you hope to gain from this community? | long text | ✅ |
| 10 | Would you be interested in... | multi-select | ✅ |
| | *Speaking at an event · Running a workshop · Volunteering · Becoming a mentor · Sponsorship opportunities · Collaborating with other members · Hosting an event* | | |

### Always shown — "Directory"
| # | Question | Type | Req |
|---|---|---|---|
| 11 | Would you like to be included in our local member directory? | single choice | ✅ |
| | *Yes, please! · No, not right now* | | |

### Always shown — "Privacy & Consent"
| # | Question | Type | Req |
|---|---|---|---|
| 12 | Do you agree that the GPC Community admins can hold the personal data that you submit in this form? (Privacy Notice link) | checkbox "I agree" | ✅ |

Privacy Notice currently links to a **Google Drive PDF**, not the site's own `/privacy` or `/gdpr-policy` page.

## Defects and gaps carried by the source form

These are inherited problems the replacement must fix, not reproduce:

1. **Directory opt-in collects nothing publishable.** Q11 asks "list me in the directory" and is asked of **everyone**, but the only business fields (name, website, Instagram) live inside the *Business* branch and are **optional**. So the question and the fields that would answer it are not connected: a Business Mum who skips B3 supplies nothing, and a Career Mum is never offered them at all — even though the form's own intro promises a directory of "local businesses **and professionals**", and the Career branch offers **Self-employed** and **Freelance** as situations. There is also no public-safe description, category, or contact field anywhere. *Resolution: the listing fields are attached to the opt-in rather than to the branch, so anyone who says yes is asked for them — see FR-003.*
2. **Email is the only contact channel captured.** Publishing it would expose a personal address; there is no separate "public contact" field.
3. **Duplicate option:** "Looking for work" appears twice in C1.
4. **"How often would you like events?" is a checkbox group**, so it accepts contradictory multi-answers (Weekly + Quarterly).
5. **Consent is a single undifferentiated tick** covering data holding only. It does not separately capture (a) newsletter/marketing consent or (b) consent to publish directory details publicly — two materially different permissions.
6. **No consent versioning or timestamp**, no record of which notice text was agreed to.
7. **Typo:** "Weekly Newletter".
8. **Postcode is free text**, unvalidated — inconsistent with the existing site's postcode handling.
9. **Every branch question is required**, including open-text challenge questions, which raises abandonment on a form already stated as ~5 minutes.
10. **No spam protection** of any kind is inheritable from Tally to a self-hosted form.
