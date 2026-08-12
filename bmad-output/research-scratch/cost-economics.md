# Cost & Economics — Event Discovery at Scale

**Research leg:** the economics. Precise, current, cited pricing for a defensible cost model.
**Date of research:** 2026-08-11. All prices verified against official vendor pages on that date unless marked `[UNVERIFIED]`.
**Budget under test:** £20/week hard cap on total API spend.

---

## 0. Currency basis

| Item | Value | Source |
|---|---|---|
| USD per GBP | **1.3498** | Federal Reserve H.10 release, rate dated 2026-08-07, published 2026-08-10 |
| £20 / week | **$27.00 / week** | 20 × 1.3498 |
| £20 / week annualised to monthly | **£86.67 / month = $117.00 / month** | (20 × 52) ÷ 12, × 1.3498 |

> ⚠️ The brief assumed ~$110/month for £87/month (implied rate ≈ 1.264). At the current Fed rate the budget is **$117/month**, ~6% more headroom than assumed. All figures below use 1.3498.

Throughout: **£ = USD ÷ 1.3498**. Monthly = weekly × 52 ÷ 12 (4.333 weeks/month).

---

## 1. Master pricing table

### 1a. Perplexity Sonar API

Source: <https://docs.perplexity.ai/getting-started/pricing> (accessed 2026-08-11)

| Model | Input $/M | Output $/M | Request fee /1K — low | — medium | — high | Batch | Cache |
|---|---|---|---|---|---|---|---|
| `sonar` | $1.00 | $1.00 | $5 | $8 | $12 | none | none |
| `sonar-pro` | $3.00 | $15.00 | $6 | $10 | $14 | none | none |
| `sonar-reasoning-pro` | $2.00 | $8.00 | $6 | $10 | $14 | none | none |
| `sonar-deep-research` | $2.00 | $8.00 | — see below — | | | none | none |

`sonar-deep-research` bills differently: **$2/M input, $8/M output, $2/M citation tokens, $3/M reasoning tokens, $5 per 1K search queries.** It has no `search_context_size` request-fee tier.

**Two findings that matter:**

1. **There is no standalone `sonar-reasoning` model on the current pricing page** — only `sonar-reasoning-pro`. The brief listed five models; there are four. If any code references `sonar-reasoning`, verify it still resolves.
2. **`search_context_size: 'high'` is the most expensive request tier on every model.** On `sonar-pro` it costs **$14/1K requests vs $6/1K at low** — a 2.33× premium on the fixed fee, paid on every single call regardless of how much you get back.

**Request fee vs token billing.** The docs state the request fee governs "how much web information is retrieved per query" and that "token pricing is unchanged" across tiers. The natural reading is that **retrieved search-context tokens are billed as input tokens *on top of* the per-request fee** — i.e. `high` costs you twice: a higher fixed fee *and* more billed input tokens. `[PARTIALLY VERIFIED — the docs do not state explicitly whether retrieved context counts toward billed input_tokens. This is the single largest uncertainty in the Scenario A model below and should be resolved by reading `usage.input_tokens` off one real production response.]`

### 1b. Anthropic Claude

Source: <https://platform.claude.com/docs/en/about-claude/pricing> (accessed 2026-08-11). Cross-checked against the in-repo `claude-api` skill.

| Model | Model ID | $/M in | $/M out | 5m cache write | 1h cache write | Cache read | Batch in/out |
|---|---|---|---|---|---|---|---|
| Claude Fable 5 | `claude-fable-5` | $10.00 | $50.00 | $12.50 | $20.00 | $1.00 | $5 / $25 |
| Claude Opus 5 | `claude-opus-5` | $5.00 | $25.00 | $6.25 | $10.00 | $0.50 | $2.50 / $12.50 |
| Claude Sonnet 5 | `claude-sonnet-5` | **$2.00** | **$10.00** | $2.50 | $4.00 | $0.20 | $1 / $5 |
| Claude Haiku 4.5 | `claude-haiku-4-5` | $1.00 | $5.00 | $1.25 | $2.00 | $0.10 | $0.50 / $2.50 |

**Multipliers (uniform across models):**
- Cache write: **1.25×** base input (5-minute TTL) / **2×** base input (1-hour TTL)
- Cache read: **0.1×** base input
- **Batch API: 50% off both input and output.** Batch and caching discounts **stack**.
- Web search server tool: **$10 per 1,000 searches**. Web fetch server tool: **no additional charge** beyond token cost.
- Anthropic sells **no embedding model**.

> 📌 **Correction to a commonly-cached figure:** Claude Sonnet 5's $2/$10 "introductory" pricing is now **permanent**. The pricing page states the scheduled 1 Sep 2026 increase to $3/$15 **will not occur**. Any cost model built on $3/$15 for Sonnet 5 is 50% too high.

**Cheapest Claude suitable for structured event extraction: Claude Haiku 4.5.** Fable 5 is Anthropic's most capable tier and is 10× the price of Haiku — wildly wrong for HTML→JSON. See §4 for per-page figures.

### 1c. OpenAI

Source: <https://developers.openai.com/api/docs/pricing> (accessed 2026-08-11)

| Model | $/M in | $/M cached in | $/M out | Batch |
|---|---|---|---|---|
| `gpt-5.6-sol` | $5.00 | $0.50 | $30.00 | 50% off |
| `gpt-5.6-terra` | $2.00 | $0.20 | $12.00 | 50% off |
| `gpt-5.6-luna` | $0.20 | $0.02 | $1.20 | 50% off |
| `gpt-5.5` | $5.00 | $0.50 | $30.00 | 50% off |
| `gpt-5.4` | $2.50 | $0.25 | $15.00 | 50% off |
| `gpt-5.4-mini` | $0.75 | $0.075 | $4.50 | 50% off |
| `gpt-5.4-nano` | $0.20 | $0.02 | $1.25 | 50% off |
| `gpt-5` | $1.25 | $0.125 | $10.00 | 50% off |
| `gpt-5-mini` | $0.25 | $0.025 | $2.00 | 50% off |
| **`gpt-5-nano`** | **$0.05** | **$0.005** | **$0.40** | 50% off |
| `gpt-4o-mini` | $0.15 | $0.075 | $0.60 | 50% off |

- Cached input discount: **90%** on the GPT-5 family (`gpt-5-nano`: $0.05 → $0.005).
- Batch API: **50% off** across all models.
- Web search tool: **$10.00 per 1,000 calls**, plus search-content tokens at model rates.
- Embeddings: `text-embedding-3-small` **$0.02/M**, `text-embedding-3-large` **$0.13/M**, `text-embedding-ada-002` $0.10/M.

**`gpt-5-nano` at $0.05/$0.40 is the cheapest first-party model from any major lab.**

### 1d. Google Gemini

Source: <https://ai.google.dev/gemini-api/docs/pricing> (accessed 2026-08-11)

| Model | $/M in | $/M out | Batch in/out | Context caching | Free tier |
|---|---|---|---|---|---|
| Gemini 3.6 Flash | $1.50 | $7.50 | $0.75 / $3.75 | $0.15/M + $1.00/M/hr storage | yes |
| Gemini 3.5 Flash | $1.50 | $9.00 | $0.75 / $4.50 | $0.15/M + $1.00/M/hr | yes |
| Gemini 3.5 Flash-Lite | $0.30 | $2.50 | $0.15 / $1.25 | $0.03/M + $1.00/M/hr | yes |
| Gemini 2.5 Flash | $0.30 (text) | $2.50 | $0.15 / $1.25 | — | yes |
| **Gemini 2.5 Flash-Lite** | **$0.10** | **$0.40** | **$0.05 / $0.20** | — | yes |
| Gemini 2.5 Pro | $1.25 (≤200k) | $10.00 | 50% off | — | limited |

- Batch mode: **50% discount**, uniformly.
- **Grounding with Google Search: 5,000 free search requests per month** (shared across all Gemini 3.x models), then **$14 per 1,000 requests**. Google Maps grounding: same 5,000-free-then-$14/1K structure.
- Embeddings: `gemini-embedding-001` **$0.15/M** (free tier available; batch $0.075/M). Gemini Embedding 2 text **$0.20/M**.

⚠️ **Free-tier quotas are `[UNVERIFIED]`.** Google no longer publishes per-model free-tier RPM/TPM/RPD on <https://ai.google.dev/gemini-api/docs/rate-limits>; the page now says limits "can be viewed in Google AI Studio" and links to a per-project dashboard. The only concrete number on that page is a Tier 1 spend limit of $10 per 10-minute window. **Do not architect around an assumed free-tier quota you cannot read from a docs page** — measure the actual project limit in AI Studio before relying on it. (Also unverified: whether free-tier traffic is exempt from Google's product-improvement data use. For a site serving parents of under-5s, check this before sending any user-derived text on the free tier.)

**The 5,000 free grounded searches/month is the single most valuable free allowance found in this research** — ~1,150/week, and it *is* published on the pricing page.

### 1e. Open / cheap inference alternatives

| Provider | Model | $/M in | $/M out | Notes | Source |
|---|---|---|---|---|---|
| DeepSeek | `deepseek-v4-flash` | $0.14 (miss) / **$0.0028 (cache hit)** | $0.28 | 50× cache-hit discount | api-docs.deepseek.com |
| DeepSeek | `deepseek-v4-pro` | $0.435 / $0.003625 | $0.87 | | api-docs.deepseek.com |
| Cohere | `command-light` | $0.30 | $0.60 | | cohere.com/pricing |
| Cohere | `command` | $1.00 | $2.00 | | cohere.com/pricing |
| Cohere | `command-r-03-2024` | $0.50 | $1.50 | | cohere.com/pricing |
| Mistral | (per-model table) | `[UNVERIFIED]` | `[UNVERIFIED]` | Main /pricing page gives only "Mistral Large $0.5 in / $1.5 out"; per-model API table not reachable. Free tier stated as **$10/mo in API credits**; batch **−50%**; cached input **up to −90%**. | mistral.ai/pricing |
| Groq / Together / Cerebras / OpenRouter | — | see §1e-supplement | | | |

**⚠️ DeepSeek posts an explicit price-rise warning** on its own pricing page: *"We plan to raise the overall pricing for DeepSeek API services in the near future, with a significant increase expected."* Do not build a budget on current DeepSeek rates without a hedge.

#### 1e-supplement — Groq / Together / Cerebras / Mistral / OpenRouter

| Provider | Model | $/M in | $/M out | Batch | Cache | Free tier | Source |
|---|---|---|---|---|---|---|---|
| **OpenRouter** | 16 × `:free` variants (e.g. `openai/gpt-oss-20b:free`, `google/gemma-4-31b-it:free`) | **$0** | **$0** | n/a | n/a | **20 RPM; 50 req/day, or 1,000 req/day after a one-time ≥$10 credit purchase** | openrouter.ai/api/v1/models |
| **OpenRouter** | `inclusionai/ling-2.6-flash` (262k ctx) | **$0.010** | **$0.030** | — | $0.002/M read | — | openrouter.ai/api/v1/models |
| **OpenRouter** | `mistralai/mistral-nemo` (131k ctx) | $0.019 | $0.030 | — | — | — | openrouter.ai |
| **OpenRouter** | `openai/gpt-oss-120b` | $0.037 | $0.170 | — | — | — | openrouter.ai (cheaper than Groq's own price for the same model) |
| **OpenRouter** | `openai/gpt-5-nano:batch` | $0.025 | $0.200 | (is the batch SKU) | — | — | openrouter.ai |
| **Together** | LFM2.5-8B-A1B | $0.03 | $0.12 | ⚠️ see note | `[UNVERIFIED]` | `[UNVERIFIED]` | together.ai/pricing |
| **Together** | gpt-oss-20B | $0.05 | $0.20 | ⚠️ see note | — | — | together.ai/pricing |
| **Together** | DeepSeek V4 Flash 0731 | $0.14 | $0.28 | ⚠️ see note | — | — | together.ai/pricing |
| **Groq** | `llama-3.1-8b-instant` (131k ctx) | **$0.05** | **$0.08** | **−50%** | **−50% automatic** | 30 RPM / 6k TPM / **500k TPD** | console.groq.com/docs/models |
| **Groq** | `openai/gpt-oss-20b` | $0.075 | $0.30 | −50% | −50% auto | 30 RPM / 8k TPM / 200k TPD (120b) | console.groq.com/docs/models |
| **Groq** | `openai/gpt-oss-120b` | $0.15 | $0.60 | −50% | −50% auto | 30 RPM / 200k TPD | console.groq.com/docs/models |
| **Mistral** | Ministral 3 (3B) | $0.10 | $0.10 | −50% | up to −90% input | $10/mo API credits | mistral.ai/pricing/api |
| **Mistral** | Ministral 3 (8B) | $0.15 | $0.15 | −50% | up to −90% | $10/mo credits | mistral.ai/pricing/api |
| **Mistral** | Mistral Small 4 | $0.15 | $0.60 | −50% | up to −90% | $10/mo credits | mistral.ai/pricing/api |
| **Cerebras** | `gpt-oss-120b` | $0.35 | $0.75 | none | none | $5 trial credits; 5 RPM / **1M tok/day** | inference-docs.cerebras.ai/models/openai-oss |
| **Cerebras** | `gemma-4-31b` | $0.99 | $1.49 | none | none | as above | inference-docs.cerebras.ai |

**Notes and gotchas discovered:**

- **Groq's cache discount is automatic (−50% on cached input, no code change, no fee) and does *not* stack with batch.** Cached tokens also don't count toward rate limits. Note the caveat for this workload: the 10k tokens per page are mostly *volatile page content*, which won't cache — only the ~2k-token system prompt + schema will.
- **⚠️ Together's "up to 50%" batch discount does NOT apply to any of its cheap models.** Only six models get it (Llama-3.3-70B-Instruct-Turbo, Llama-3-70b-chat-hf, Qwen2.5-7B-Instruct-Turbo, Mixtral-8x7B-Instruct-v0.1, GLM-4.5-Air-FP8, whisper-large-v3). Every model in the table above runs at standard rates in batch. This is a common modelling error.
- **Mistral Nemo is gone from Mistral's own price list** — superseded by the Ministral 3 line. It is still served on OpenRouter at $0.019/$0.030.
- **Mistral's `/pricing` page does not carry the per-model table** — the real grid is at `mistral.ai/pricing/api`. Mistral's own help centre confirms prepaying credits does *not* raise rate limits; tier upgrades come only from cumulative billing thresholds.
- **Cerebras publishes no per-token table on its pricing page at all** — rates live on individual model doc pages. It has no batch and no cache discount: you are paying for latency, not price. Its "Code" plans (Pro $50/mo, Max $200/mo) are both listed **sold out** and are coding-agent plans, not general API.
- **Groq's pricing page URLs are broken** (`groq.com/pricing/` serves marketing; `console.groq.com/docs/pricing` and `/pricing` both 404). `console.groq.com/docs/models.md` is now the authoritative price list.
- **OpenRouter takes no markup on inference** — provider pricing passes through. The fee is on credit purchases: **5.5% (min $0.80) via Stripe, 5% via USDC.**

**Free-tier ceilings for a 10k-token-per-page workload:**

| Provider | Free allowance | Pages/day free | Pages/week free |
|---|---|---|---|
| **OpenRouter `:free` variants** (after one-time $10 credit purchase) | 1,000 req/day, 20 RPM | **1,000** | **7,000** |
| Cerebras trial | 1M tokens/day, 5 RPM | ~94 (RPM-throttled) | ~660 |
| Groq free tier (`llama-3.1-8b-instant`) | 500k TPD | **~50** (TPD binds first) | ~350 |
| Mistral free plan | $10/mo credits | ~300 (at Ministral 3B rates) | ~2,100 |

**The OpenRouter free path is the standout: 7,000 pages/week at zero marginal cost**, after a one-time $10 credit purchase (the credits remain spendable — it is a threshold, not a fee). That is more than 10× the 600 pages/week Scenario B needs.

⚠️ **Reliability caveat, flagged explicitly:** "supports structured outputs" in a model catalog is a *capability flag, not a reliability guarantee*. The sub-$0.03/M models (`ling-2.6-flash`, `mistral-nemo`) and the `:free` variants are small enough that JSON-schema adherence against messy real-world HTML must be benchmarked before committing. The price gap between them and a known-good option is measured in **tenths of a penny per week at this volume** — see §6.



### 1f. Embeddings (for deduplication)

| Provider | Model | $/M tokens | Free allowance | Source |
|---|---|---|---|---|
| OpenAI | `text-embedding-3-small` | **$0.02** | none | developers.openai.com |
| OpenAI | `text-embedding-3-large` | $0.13 | none | developers.openai.com |
| Voyage | `voyage-4-lite` | **$0.02** | **200M tokens free** | docs.voyageai.com |
| Voyage | `voyage-4` | $0.06 | 200M tokens free | docs.voyageai.com |
| Voyage | `voyage-4-large` | $0.12 | 200M tokens free | docs.voyageai.com |
| Google | `gemini-embedding-001` | $0.15 (batch $0.075) | free tier available | ai.google.dev |
| Google | Gemini Embedding 2 (text) | $0.20 | free tier available | ai.google.dev |
| Cohere | Embed 4 | `[UNVERIFIED]` — "priced per 1M tokens", rate not published on the pricing page | trial key free (non-production) | cohere.com/pricing |

Voyage Batch API: **−33%** (but free-token credits do not apply to batch).

**Cost of embedding 1,000 event titles + descriptions.** Assume title ≈ 15 tokens + description ≈ 200 tokens + venue/date fields ≈ 35 tokens = **250 tokens per event → 0.25M tokens per 1,000 events.**

| Model | Cost per 1,000 events | Cost per 400 events/week | Annualised (52 × 400) |
|---|---|---|---|
| `text-embedding-3-small` | **$0.0050** | $0.0020 | $0.104 |
| `voyage-4-lite` | $0.0050 (**$0 for the first 800,000 events** under the 200M free tokens) | $0 | $0 |
| `voyage-4` | $0.0150 | $0.0060 | $0.312 |
| `gemini-embedding-001` | $0.0375 | $0.0150 | $0.780 |
| `text-embedding-3-large` | $0.0325 | $0.0130 | $0.676 |

**Verdict: embeddings are free at this scale.** Half a US cent per thousand events; ten cents a *year* at 400/week. `voyage-4-lite`'s 200M free tokens cover ~800,000 events outright. **pgvector is a Postgres extension already available on Supabase — no separate vector-DB line item; you pay only incremental row storage.** Deduplication should never appear as a cost consideration in any architecture decision here.

---

## 2. Search APIs (decoupling "search" from "LLM")

| Provider | Price | Free tier | Status / notes | Source |
|---|---|---|---|---|
| **Serper.dev** | **~$0.30 / 1,000 queries** `[PARTIALLY VERIFIED]` | 2,500 free queries, no card | Cheapest by an order of magnitude. Google SERP data. Price appears on serper.dev's own homepage per the search index, but `/pricing` returns 404 to direct fetch — **confirm in-console before committing.** | serper.dev |
| **Brave Search API** | **$5 / 1,000** (Search plan) | **$5/mo credit auto-applied = 1,000 free queries/month** | 50 QPS. Independent index. "Answers" plan: $4/1K + $5/M tokens, 2 QPS. | brave.com/search/api |
| **Google Custom Search JSON API** | $5 / 1,000 | **100 queries/day free** | ☠️ **CLOSED TO NEW CUSTOMERS. Discontinued 1 Jan 2027.** Capped at 10k queries/day. **Do not build on this.** | developers.google.com/custom-search |
| **Exa** | $7 / 1,000 (standard search); deep-lite/deep $12/1K; deep-reasoning $15/1K; **contents $1 / 1,000 pages per content type** | $20 free credits (~2,800 searches) + **$10/month recurring free credit** | Pay-as-you-go, no subscription, no minimum. The $1/1K *contents* rate is notable — cheap bulk page-text retrieval. | exa.ai/pricing |
| **Tavily** | **$8 / 1,000** ($0.008/credit PAYG) | **1,000 free credits/month** | Credits vary by request type (search/extract/crawl). Free for students. | tavily.com/pricing |
| **Google Search grounding (Gemini)** | $14 / 1,000 | **5,000 free/month** shared across Gemini 3.x | Bundled with the LLM call, not a standalone SERP API. | ai.google.dev/pricing |
| **Anthropic web search tool** | $10 / 1,000 | none | Bundled server tool. **Web *fetch* is free** (token cost only). | platform.claude.com/docs/en/about-claude/pricing |
| **OpenAI web search tool** | $10 / 1,000 | none | Bundled server tool. | developers.openai.com |
| **Bing Search API** | — | — | ☠️ **RETIRED 11 August 2025.** All instances decommissioned; no new signup. Migration path is "Grounding with Bing Search" inside Azure AI Agents / AI Foundry — a full Azure platform commitment, not a drop-in. Replacement pricing `[UNVERIFIED]` (not published on the AI Foundry pricing page fetched). | learn.microsoft.com lifecycle announcement |

**Combined free search allowance available every month, at zero cost:**

| Source | Free queries/month |
|---|---|
| Gemini Google Search grounding | 5,000 |
| Brave ($5 credit ÷ $5/1K) | 1,000 |
| Tavily | 1,000 |
| Exa ($10 credit ÷ $7/1K) | ~1,430 |
| **Total** | **~8,430 free searches/month (~1,950/week)** |

That is more search volume than a 400-event/week pipeline needs, **before spending a penny.** This is the headline economic fact of this research.

---

## 3. True cost of the CURRENT single Perplexity call

**Configuration:** one `sonar-pro` call per discovery run, `max_tokens: 8000`, `web_search_options.search_context_size: 'high'`, returns 25–30 events.

### Worked cost

| Line item | Basis | Rate | Low estimate | Central | High estimate |
|---|---|---|---|---|---|
| Request fee | 1 request, `high` tier | $14 / 1,000 | $0.01400 | $0.01400 | $0.01400 |
| Input — your prompt | ~1,500 tok | $3 / M | $0.00450 | $0.00450 | $0.00450 |
| Input — retrieved search context | 0 / 8,000 / 20,000 tok | $3 / M | $0.00000 | $0.02400 | $0.06000 |
| Output — event JSON | 4,000 / 6,000 / 8,000 tok (cap 8,000) | $15 / M | $0.06000 | $0.09000 | $0.12000 |
| **Total per call** | | | **$0.0785** | **$0.1325** | **$0.1985** |
| **Per call (£)** | | | £0.058 | **£0.098** | £0.147 |
| **Cost per event** (27 events) | | | $0.0029 | **$0.0049** | $0.0074 |

**Central estimate: ~$0.13 per call ≈ £0.10, or roughly half a US cent per event delivered.**

### What this tells you

1. **The current single call costs about 10 pence.** At one run per week that is **£0.10/week — 0.5% of the £20 budget.** There is 199× headroom on the current design.
2. **Output tokens dominate.** 45–60% of the call cost is the `sonar-pro` output rate of $15/M. Switching to `sonar` ($1/M output, $12/1K high request fee) would cut the same call to roughly **$0.012 + $0.0015 + $0.008 + $0.006 ≈ $0.028** — a **~79% saving** — if `sonar`'s output quality is adequate for structured event extraction. That is the single highest-leverage price lever available without changing architecture.
3. **`search_context_size: 'high'` costs $0.008/call more than `low` in fixed fee alone** ($14 vs $6 per 1K), plus whatever extra context tokens it injects. At 1 call/week this is noise; at 200 calls/week it is $1.60/week of pure fixed fee.
4. **The `high` context tier is the wrong knob for breadth.** It buys *depth on one query*, not *more distinct events*. More events comes from more queries, not a bigger context window per query.

### Hard ceiling on Perplexity call volume

At $27.00/week and $0.1325/call: **204 `sonar-pro` calls/week maximum** if Perplexity is the only spend. Using `sonar` instead: **~964 calls/week.**

---

## 4. Extraction cost per page (the Scenario B unit economic)

**Unit:** one cleaned web page, ~10,000 input tokens (post-boilerplate-strip HTML or extracted text) → ~600 output tokens of structured event JSON.

| Model | $/M in | $/M out | Input cost | Output cost | **$/page** | 400 pages/wk | 600 pages/wk |
|---|---|---|---|---|---|---|---|
| **OpenRouter `:free` variants** (e.g. `gpt-oss-20b:free`) | 0 | 0 | $0 | $0 | **$0.00000** | $0.00 | $0.00 |
| **OpenRouter `ling-2.6-flash`** | 0.010 | 0.030 | $0.00010 | $0.000018 | **$0.00012** | $0.05 | $0.07 |
| OpenRouter `mistral-nemo` | 0.019 | 0.030 | $0.00019 | $0.000018 | $0.00021 | $0.08 | $0.12 |
| **Groq `llama-3.1-8b-instant` (batch)** | 0.025 | 0.04 | $0.00025 | $0.000024 | **$0.00027** | $0.11 | $0.16 |
| Together LFM2.5-8B-A1B | 0.03 | 0.12 | $0.00030 | $0.000072 | $0.00037 | $0.15 | $0.22 |
| **`gpt-5-nano` (batch)** | 0.025 | 0.20 | $0.00025 | $0.00012 | **$0.00037** | $0.15 | $0.22 |
| OpenRouter `gpt-oss-120b` | 0.037 | 0.170 | $0.00037 | $0.000102 | $0.00047 | $0.19 | $0.28 |
| **Groq `llama-3.1-8b-instant`** | 0.05 | 0.08 | $0.00050 | $0.000048 | **$0.00055** | $0.22 | $0.33 |
| **Gemini 2.5 Flash-Lite (batch)** | 0.05 | 0.20 | $0.00050 | $0.00012 | **$0.00062** | $0.25 | $0.37 |
| **`gpt-5-nano`** | 0.05 | 0.40 | $0.00050 | $0.00024 | **$0.00074** | $0.30 | $0.44 |
| Groq `openai/gpt-oss-20b` | 0.075 | 0.30 | $0.00075 | $0.00018 | $0.00093 | $0.37 | $0.56 |
| Mistral Ministral 3 (3B) | 0.10 | 0.10 | $0.00100 | $0.00006 | $0.00106 | $0.42 | $0.64 |
| **Gemini 2.5 Flash-Lite** | 0.10 | 0.40 | $0.00100 | $0.00024 | **$0.00124** | $0.50 | $0.74 |
| DeepSeek `v4-flash` | 0.14 | 0.28 | $0.00140 | $0.00017 | $0.00157 | $0.63 | $0.94 |
| `gpt-4o-mini` | 0.15 | 0.60 | $0.00150 | $0.00036 | $0.00186 | $0.74 | $1.12 |
| `gpt-5.6-luna` | 0.20 | 1.20 | $0.00200 | $0.00072 | $0.00272 | $1.09 | $1.63 |
| `gpt-5.4-nano` | 0.20 | 1.25 | $0.00200 | $0.00075 | $0.00275 | $1.10 | $1.65 |
| `gpt-5-mini` | 0.25 | 2.00 | $0.00250 | $0.00120 | $0.00370 | $1.48 | $2.22 |
| Gemini 2.5 Flash / 3.5 Flash-Lite | 0.30 | 2.50 | $0.00300 | $0.00150 | $0.00450 | $1.80 | $2.70 |
| **Claude Haiku 4.5 (batch)** | 0.50 | 2.50 | $0.00500 | $0.00150 | **$0.00650** | $2.60 | $3.90 |
| **Claude Haiku 4.5** | 1.00 | 5.00 | $0.01000 | $0.00300 | **$0.01300** | $5.20 | $7.80 |
| Claude Sonnet 5 | 2.00 | 10.00 | $0.02000 | $0.00600 | $0.02600 | $10.40 | $15.60 |
| Claude Opus 5 | 5.00 | 25.00 | $0.05000 | $0.01500 | $0.06500 | $26.00 | $39.00 |
| Claude Fable 5 | 10.00 | 50.00 | $0.10000 | $0.03000 | $0.13000 | $52.00 | $78.00 |

**Answer to the brief's question — cheapest model suitable for structured extraction of event data from a web page:**

- **Free floor: OpenRouter `:free` variants — $0/page, 7,000 pages/week** after a one-time ≥$10 credit purchase (the credits stay spendable). Small models; benchmark schema adherence before trusting.
- **Cheapest paid: OpenRouter `ling-2.6-flash` at $0.00012/page** — $0.07/week for 600 pages. **Groq `llama-3.1-8b-instant` at $0.00055/page** ($0.00027 batched) is the cheapest option with a first-party SLA and real batch/cache economics.
- **Cheapest from a major lab: `gpt-5-nano` at $0.00074/page** ($0.00037 batched). At 400 pages/week that is **$0.30/week = £0.22/week — 1.1% of budget.**
- **Gemini 2.5 Flash-Lite at $0.00124/page** sits next to the 5,000-free-searches/month grounding allowance in the same account — a real consolidation benefit.
- **Claude Haiku 4.5 at $0.01300/page** is 17.6× `gpt-5-nano` but still only **$5.20/week (£3.85) for 400 pages — 19% of budget.** Haiku is the right *escalation* tier: run a nano-class model as primary and re-run only the pages where it returns low-confidence or schema-invalid output.
- **Fable 5 is a category error for this task** — $52/week for 400 pages, 2.6× the entire budget, for HTML→JSON work a nano-class model does correctly.

> 🔑 **The decisive observation: at 600 pages/week the entire spread from the cheapest paid extractor to Claude Haiku 4.5 is $0.07 → $7.80/week, i.e. £0.05 → £5.78/week.** The gap between "cheapest possible" and "known-reliable" is under **£6/week** — less than a third of the budget. **Choose the extraction model on schema-adherence reliability, not on price.** Optimising from $0.00074 to $0.00012 per page saves £0.28/week and is not worth one hour of debugging malformed JSON.

**Prompt caching amplifies this further.** The extraction system prompt + JSON schema (~2,000 tokens) is byte-identical on every call. With `gpt-5-nano` cached input at $0.005/M, those 2,000 tokens cost $0.00001 instead of $0.0001. With Haiku 4.5's 0.1× cache read, the same block costs $0.0002 instead of $0.002. Order the prompt as `[stable schema + instructions] → [volatile page HTML]` so the cache prefix never breaks.

---

## 5. Three-scenario cost model — target 400 events/week

**Common assumptions across all scenarios:**
- Target: **400 quality event records discovered or refreshed per week.**
- Page fetching (HTTP GET, boilerplate stripping) runs on Supabase Edge Functions / a cron worker: **$0 marginal API cost.**
- Deduplication embeddings: **$0.002/week** (§1f) — rounded to $0.00 in totals below.
- pgvector on Supabase: no incremental line item.
- Budget line: **$27.00/week / $117.00/month.**

### Scenario A — current approach scaled up (N × Perplexity `sonar-pro`)

Perplexity returns 25–30 events per call, but successive calls on a small geography overlap heavily. Modelled at three overlap assumptions.

| Variant | Calls/week | $/call | $/week | £/week | $/month | £/month | Fits £20/wk? |
|---|---|---|---|---|---|---|---|
| A1 — optimistic (40% overlap → 16 net/call) | 25 | $0.1325 | $3.31 | **£2.45** | $14.35 | £10.63 | ✅ 12% of budget |
| A2 — realistic (70% overlap → 8 net/call) | 50 | $0.1325 | $6.63 | **£4.91** | $28.70 | £21.27 | ✅ 25% of budget |
| A3 — grid: 12 areas × 8 categories, weekly | 96 | $0.1325 | $12.72 | **£9.42** | $55.12 | £40.83 | ✅ 47% of budget |
| A4 — grid run **daily** (96 × 7) | 672 | $0.1325 | $89.04 | **£65.97** | $385.8 | £285.8 | ❌ **330% over** |
| A5 — A3 but on `sonar` not `sonar-pro` | 96 | ~$0.028 | $2.69 | **£1.99** | $11.65 | £8.63 | ✅ 10% of budget |

**Verdict: Scenario A fits the budget — this is the counterintuitive finding.** At weekly cadence, even a full 96-call borough×category grid consumes under half the budget. **The hard ceiling is ~204 `sonar-pro` calls/week.** Perplexity only breaks the budget at daily cadence (A4).

**But cost is not why Scenario A is the wrong answer.** Its problems are recall and duplication: each call returns the same well-indexed venues, so net-new events per marginal call collapses fast, and there is no mechanism to reach the long tail (a church-hall stay-and-play with one Facebook page and no SEO). You are paying a premium per call for a *search engine's* view of what exists, which is precisely the subset a crawler can also find. Scenario A is budget-viable and coverage-limited.

### Scenario B — crawl-first + cheap-LLM extraction

Curated source list of ~300 venue/organiser/council/library sites; fetch 600 pages/week (each source's listing page + detail pages); extract with a nano-class model; escalate ~10% of pages to Haiku 4.5 for validation.

| Line item | Volume | Rate | $/week | £/week |
|---|---|---|---|---|
| Page fetching (self-hosted) | 600 pages | $0 | $0.00 | £0.00 |
| Primary extraction — `gpt-5-nano` | 600 pages | $0.00074/pg | $0.44 | £0.33 |
| Escalation/validation — Haiku 4.5 | 60 pages | $0.01300/pg | $0.78 | £0.58 |
| Dedup embeddings | 400 events | $0.02/M | $0.00 | £0.00 |
| **Total B1 (`gpt-5-nano` primary)** | | | **$1.22** | **£0.90** |
| **Monthly B1** | | | **$5.29** | **£3.92** |

| Alternative primary extractor | $/week | £/week | £/month |
|---|---|---|---|
| B2 — Gemini 2.5 Flash-Lite primary | $1.52 | £1.13 | £4.89 |
| B3 — Haiku 4.5 for *everything* (600 pages) | $7.80 | £5.78 | £25.04 |
| B4 — `gpt-5-nano` batched + Haiku escalation | $1.00 | £0.74 | £3.21 |

**Verdict: fits with enormous room — B1 uses 4.5% of the weekly budget.** Even the "use Haiku for everything, no cheap tier" variant (B3) is 29% of budget. This means **you can run Scenario B daily rather than weekly**: 600 pages × 7 = 4,200 pages/week at `gpt-5-nano` = $3.11/week = £2.30/week, still 11.5% of budget. Freshness is free here in a way it is not in Scenario A.

The real cost of Scenario B is **engineering time to build and maintain the source list and the fetch/parse layer** — not API spend.

### Scenario C — hybrid (free feeds + crawl + limited paid discovery)

The recommended shape: exhaust free structured data first, crawl the known universe, and spend only on genuine novelty discovery.

| Layer | Volume | Rate | $/week | £/week |
|---|---|---|---|---|
| **Free structured feeds** — schema.org/Event JSON-LD, council/library ICS + RSS, sitemap crawl | ~150 events | $0 | $0.00 | £0.00 |
| **Crawl + fetch** 600 pages | 600 | $0 | $0.00 | £0.00 |
| **Extraction** — `gpt-5-nano` primary | 600 pages | $0.00074/pg | $0.44 | £0.33 |
| **Escalation** — Haiku 4.5 on hard/ambiguous pages | 60 pages | $0.01300/pg | $0.78 | £0.58 |
| **Novelty search — free allowance first** (Gemini grounding 1,150/wk + Brave 230/wk + Tavily 230/wk + Exa 330/wk) | ~1,940 queries | $0 | $0.00 | £0.00 |
| **Paid overflow search** — Serper @ $0.30/1K | 1,000 queries | $0.30/1K | $0.30 | £0.22 |
| **Perplexity `sonar-pro`** — genuine open-ended discovery only | 15 calls | $0.1325 | $1.99 | £1.47 |
| **Dedup embeddings** — `voyage-4-lite` (free tier) | 400 events | $0 | $0.00 | £0.00 |
| **Total C** | | | **$3.51** | **£2.60** |
| **Monthly C** | | | **$15.21** | **£11.27** |

**Verdict: fits at 13% of the weekly budget.** Leaves £17.40/week of headroom for cadence increases, quality escalation, re-verification passes, and a safety margin against DeepSeek-style price rises.

### Scenario comparison

| | Scenario A (Perplexity scaled) | Scenario B (crawl + cheap LLM) | Scenario C (hybrid) |
|---|---|---|---|
| **£/week** | £2.45 – £9.42 (weekly cadence) | **£0.90** | **£2.60** |
| **£/month** | £10.63 – £40.83 | **£3.92** | **£11.27** |
| **% of £20/wk budget** | 12% – 47% | **4.5%** | **13%** |
| **Fits £20/week?** | ✅ weekly / ❌ daily | ✅ ✅ | ✅ ✅ |
| **Daily cadence affordable?** | ❌ (£66/wk) | ✅ (£2.30/wk) | ✅ (~£8/wk) |
| **Long-tail coverage** | Poor — SEO-indexed venues only | Good — whatever you point it at | Best |
| **Marginal cost per extra event** | ~$0.008 (at 70% overlap) | ~$0.0011 | ~$0.0035 |
| **Main risk** | Recall ceiling, duplicate spend | Source-list maintenance burden | Complexity |

---

## 6. Recommendation — cheapest defensible stack under £20/week

**Scenario C, built in this order:**

| Layer | Choice | Why | £/week |
|---|---|---|---|
| **1. Structured feeds** | schema.org/Event JSON-LD, ICS, RSS, sitemaps | Free, highest-fidelity data on the page. Always try this before an LLM sees the HTML. | £0.00 |
| **2. Fetch** | Self-hosted cron worker / Supabase Edge Function | Web fetching is not an API product. Never pay a vendor to GET a URL. | £0.00 |
| **3. Primary extraction** | **`gpt-5-nano`** ($0.05/$0.40) with a cached system prompt | Cheapest credible model from a major lab with a first-party SLA; $0.00074/page. **Equally defensible alternatives, all within £0.30/week of each other:** Gemini 2.5 Flash-Lite ($0.00124/pg, consolidates billing with layer 5); Groq `llama-3.1-8b-instant` ($0.00055/pg, automatic −50% prompt cache). **Cost-floor option: OpenRouter `:free` variants at £0.00/week for up to 7,000 pages/week** — viable, but benchmark JSON-schema adherence first and keep a paid fallback. | £0.33 |
| **4. Escalation / validation** | **Claude Haiku 4.5** on schema-invalid or low-confidence output (~10%) | $0.013/page buys materially better structured-output reliability where it matters. Keeps a quality floor without paying it on every page. | £0.58 |
| **5. Novelty search** | **Free allowances first** (Gemini grounding 5,000/mo, Brave 1,000/mo, Tavily 1,000/mo, Exa ~1,430/mo ≈ **8,430 free/month**), then **Serper at ~$0.30/1K** | ~1,950 free searches/week covers the whole need. Serper as paid overflow is 17× cheaper than Brave and 47× cheaper than Gemini grounding overage. | £0.22 |
| **6. Open-ended discovery** | **Perplexity `sonar-pro`, ~15 calls/week**, `search_context_size: 'medium'` | Keep it for what it is genuinely good at — open-ended "what's new" queries. Drop `high` → `medium` for a $4/1K fixed-fee saving. Test `sonar` as a further ~79% cut. | £1.47 |
| **7. Dedup** | **`voyage-4-lite`** embeddings (200M free tokens ≈ 800,000 events) + **pgvector on Supabase** | Genuinely free at this scale. `text-embedding-3-small` at $0.02/M is the equivalent fallback. | £0.00 |
| | **TOTAL** | | **£2.60/week (£11.27/month) — 13% of budget** |

### The three decisions that actually drive the architecture

1. **Decouple search from the LLM.** Perplexity bundles retrieval + inference at $0.1325/call. Doing the same work as [free search] + [self-hosted fetch] + [nano extraction] costs ~$0.001–0.003 per event — **a 40–120× unit-cost reduction.** This is not a marginal optimisation; it is the whole finding.
2. **Extraction belongs on a nano-class model, not a frontier one.** HTML→JSON against a fixed schema is the cheapest possible LLM task. $0.00074/page vs $0.13/page (Fable 5) is a **176× spread** for work the cheap model does correctly. Reserve Haiku 4.5 for a ~10% escalation tier. And within the nano class, **do not micro-optimise**: the whole cheapest-to-Haiku spread is under £6/week, so pick on schema-adherence reliability.
3. **The £20/week budget is not the binding constraint.** Every viable scenario lands between 4.5% and 47% of it. The binding constraints are **recall** (can you find the long tail?) and **maintenance** (who keeps the source list alive?). Spend the headroom on cadence — daily runs cost £2.30–£8/week — and on a quality-escalation tier, not on a more expensive model.

### Cost sensitivity / risks

| Risk | Impact | Mitigation |
|---|---|---|
| DeepSeek's published intent to raise prices "significantly" | Low — not in the recommended stack | Already excluded from the recommendation |
| Gemini free-tier quotas unverifiable from docs | Medium — 5,000 free grounded searches/mo is a load-bearing assumption in layer 5 | The 5,000/mo figure **is** on the pricing page and is verified; only the *inference* free-tier RPD is unverified. Do not depend on free-tier *inference*. |
| Serper's $0.30/1K only partially verified | Low — £0.22/week line item | Falls back to Brave at $5/1K → £3.70/week. Still fits. |
| Perplexity search-context tokens billed as input | Low — moves the per-call estimate within the $0.079–$0.199 band already modelled | Read `usage.input_tokens` off one production response to close it |
| Google Custom Search JSON API discontinuation (1 Jan 2027) | None — excluded | Do not adopt |
| Bing Search API retired (11 Aug 2025) | None — excluded | Do not adopt |

---

## 7. Bibliography

All URLs accessed **2026-08-11** unless otherwise noted.

| # | Source | URL | What it verified |
|---|---|---|---|
| 1 | Perplexity — Sonar API pricing | <https://docs.perplexity.ai/getting-started/pricing> | Model line-up, $/M in/out, per-1K request fees by `search_context_size` |
| 2 | Anthropic — Pricing | <https://platform.claude.com/docs/en/about-claude/pricing> | Claude model rates, cache write/read multipliers, 50% batch discount, web search $10/1K, Sonnet 5 $2/$10 permanence |
| 3 | Anthropic — `claude-api` skill (in-repo, cached 2026-06-24) | `/private/tmp/claude-501/bundled-skills/.../claude-api` | Authoritative model IDs; cross-checked against #2 |
| 4 | OpenAI — API pricing | <https://developers.openai.com/api/docs/pricing> | GPT-5 family rates, cached-input discount, batch discount, embeddings, web search $10/1K |
| 5 | Google — Gemini API pricing | <https://ai.google.dev/gemini-api/docs/pricing> | Flash/Flash-Lite rates, batch −50%, context caching, embeddings, **Google Search grounding 5,000 free/mo then $14/1K** |
| 6 | Google — Gemini API rate limits | <https://ai.google.dev/gemini-api/docs/rate-limits> | Confirmed free-tier RPM/TPM/RPD are **no longer published**; Tier 1 spend limit $10/10min |
| 7 | Brave — Search API | <https://brave.com/search/api/> | $5/1K Search plan, $5/mo free credit, 50 QPS; Answers plan $4/1K + $5/M tokens |
| 8 | Serper.dev | <https://serper.dev/> | 2,500 free queries, no card. **$0.30/1K partially verified** — `/pricing` and `/pricing-and-plans` both 404 |
| 9 | Exa — Pricing | <https://exa.ai/pricing> | $7/1K search, $12–15/1K deep, $1/1K contents pages, $20 signup + $10/mo free credits |
| 10 | Tavily — Pricing | <https://www.tavily.com/pricing> | 1,000 free credits/mo, $0.008/credit PAYG = $8/1K |
| 11 | Google — Custom Search JSON API overview | <https://developers.google.com/custom-search/v1/overview> | 100/day free, $5/1K, 10k/day cap, **closed to new customers, discontinued 2027-01-01** |
| 12 | Microsoft — Bing Search API retirement | <https://learn.microsoft.com/en-us/lifecycle/announcements/bing-search-api-retirement> | **Retired 2025-08-11**, decommissioned, migrate to Grounding with Bing in Azure AI Agents |
| 13 | Microsoft — Azure AI Foundry pricing | <https://azure.microsoft.com/en-us/pricing/details/ai-foundry/> | Grounding-with-Bing per-1K price **not found** — `[UNVERIFIED]` |
| 14 | DeepSeek — Pricing | <https://api-docs.deepseek.com/quick_start/pricing> | v4-flash / v4-pro rates, cache-hit pricing, **explicit price-increase warning** |
| 15 | Voyage AI — Pricing | <https://docs.voyageai.com/docs/pricing> | Embedding rates, 200M free tokens, batch −33% |
| 16 | Cohere — Pricing | <https://cohere.com/pricing> | Command family rates; **Embed 4 per-token rate not published** — `[UNVERIFIED]` |
| 17 | Mistral — API pricing | <https://mistral.ai/pricing/api> | Per-model grid: Ministral 3 (3B/8B/14B), Mistral Small 4, Large 3, Medium 3.5. Batch −50%, cache −90%, $10/mo free credits (from <https://mistral.ai/pricing>) |
| 18 | Federal Reserve — H.10 Foreign Exchange Rates | <https://www.federalreserve.gov/releases/h10/current/> | **USD/GBP = 1.3498**, rate date 2026-08-07, released 2026-08-10 |
| 19 | Groq — Models & pricing | <https://console.groq.com/docs/models.md> | Per-model $/M rates. (`groq.com/pricing/` serves marketing; `console.groq.com/docs/pricing` and `/pricing` both 404) |
| 20 | Groq — Batch / prompt caching / rate limits | <https://console.groq.com/docs/batch>, `/docs/prompt-caching`, `/docs/rate-limits` | Batch −50%; automatic cache −50% (does **not** stack with batch); free-tier RPM/TPM/TPD per model |
| 21 | Together AI — Pricing | <https://www.together.ai/pricing> + <https://docs.together.ai/docs/batch-inference> | Per-model rates; **batch −50% applies to only six models, none of them the cheap ones** |
| 22 | Cerebras — Model docs | <https://inference-docs.cerebras.ai/models/openai-oss>, `/models/gemma-4-31b`, <https://www.cerebras.ai/pricing> | Per-token rates (pricing page carries no table); $5 trial, 5 RPM / 1M tok/day; no batch, no cache |
| 23 | OpenRouter — Model catalog (machine-readable) | <https://openrouter.ai/api/v1/models> | 406 models incl. 16 × `:free`; per-model prompt/completion rates; structured-output capability flags |
| 24 | OpenRouter — Limits & FAQ | <https://openrouter.ai/docs/api-reference/limits>, <https://openrouter.ai/docs/faq> | Free-variant caps (20 RPM; 50/day, or 1,000/day after one-time ≥$10 purchase); no inference markup; 5.5% Stripe / 5% USDC credit fee |

### Items explicitly marked `[UNVERIFIED]`

- Gemini free-tier RPM/TPM/RPD per model (not published; AI Studio dashboard only)
- Gemini free-tier data-use terms for product improvement
- Serper.dev paid per-1K rate (`$0.30/1K` from homepage via search index; pricing page 404s on direct fetch)
- Cohere Embed 4 per-million-token rate
- Together AI: prompt-cache discount and free-tier allowance (neither published)
- Cerebras: batch and cache discounts (none published — assumed absent); `zai-glm-4.7` pricing
- Groq Developer-tier RPM/TPM (account-specific; docs say only "significantly increased")
- Mistral free-plan RPS/TPM limits (Admin Panel only)
- Azure "Grounding with Bing Search" per-1K replacement pricing
- Whether Perplexity bills retrieved search-context tokens as `input_tokens` in addition to the per-request fee
- Eventbrite public search API availability (referenced as a possible free feed in Scenario C; not researched in this leg)
