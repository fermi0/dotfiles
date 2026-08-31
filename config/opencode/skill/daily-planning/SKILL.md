---
name: daily-planning
description: Build evidence-based daily plans, motivation, habit systems, and self-development routines. Use when generating a daily to-do or plan, setting goals, building habits, planning around energy, doing a weekly review, recovering from burnout, or generating motivational/self-development content. Strictly no pseudoscience (no MBTI, manifestation, astrology, personality quizzes). AI-agent-first: how an agent should generate, structure, and review plans.
created: 2026-08-30
status: draft
sources:
  - "https://daily-productivity-2026.com/"  # science-backed 2026 strategies
  - "https://sdt2026.org/"  # Self-Determination Theory 2026 conference
  - "https://en.wikipedia.org/wiki/Procrastination"  # implementation intention
  - "https://en.wikipedia.org/wiki/Ultradian_rhythm"  # 90-min cycles
  - "https://en.wikipedia.org/wiki/Habit"  # habit formation
  - "https://en.wikipedia.org/wiki/Self-determination_theory"
  - "https://www.calnewport.com/books/deep-work/"  # deep work (canonical)
  - "https://jamesclear.com/atomic-habits"  # habit stacking, 2-minute rule
tags:
  - skill
  - productivity
  - planning
  - habits
  - meta
---

# Daily Planning (Evidence-Based, 2026)

Generate daily plans, motivation, and habit systems **only from methods with research backing**. No pseudoscience (no MBTI, manifestation, astrology, Enneagram, zodiac, personality quizzes). Optimized for both humans and AI agents writing plans.

> **The user's reality:** you have ADHD-style distraction, business + dev work competing, monsoon/festival seasonality (Nepal context), and an AI agent that may be generating the plan. This skill respects all of that.

## How to use this skill

1. **Generate today's plan** → [§ Plan generation (the core)](#plan-generation-the-core) + [§ Daily plan template](#daily-plan-template)
2. **Set / review goals** → [§ Goal setting (SMART + OKRs)](#goal-setting-smart--okrs)
3. **Prioritize the to-do list** → [§ Prioritization (Eisenhower + RICE)](#prioritization-eisenhower--rice)
4. **Plan around energy** → [§ Energy curve & chronotype](#energy-curve--chronotype)
5. **Build / break a habit** → [§ Habit formation & breaking](#habit-formation--breaking)
6. **Stay consistent** → [§ Consistency management](#consistency-management)
7. **Weekly / monthly review** → [§ Weekly review](#weekly-review)
8. **Reflect** → [§ Reflection & journaling](#reflection--journaling)
9. **Recover from a bad stretch** → [§ Burnout prevention & recovery](#burnout-prevention--recovery)
10. **Learn something** → [§ Learning & spaced repetition](#learning--spaced-repetition)
11. **Plan a project** → [§ Project planning](#project-planning)
12. **AI agent generating a plan** → [§ How an AI agent should generate plans](#how-an-ai-agent-should-generate-plans)

## The no-pseudoscience rule (non-negotiable)

**Allowed** (peer-reviewed or strong evidence):
- Implementation intentions (Gollwitzer; meta-analytic d ≈ 0.65)
- Habit stacking, 2-minute rule (Fogg B=MAP)
- Ultradian rhythm (90-min cycles; vigilance drops after 20–30 min)
- SDT — autonomy, competence, relatedness (Deci & Ryan)
- SMART goals (specific + feedback-bearing)
- OKRs (Objectives + Key Results)
- Eisenhower matrix (urgent/important)
- RICE prioritization
- Spaced repetition (Ebbinghaus forgetting curve)
- Spaced repetition app algorithms (Anki SM-2, FSRS)
- Energy management (time-of-day, chronotype)
- Three Good Things (Seligman; 1–3×/week)
- Pomodoro / deep work blocks (focused vs. distributed practice)
- Process / system identity ("I am someone who...")

**NOT allowed** (no evidence, frequently pseudoscientific):
- ❌ MBTI / 16 personalities (no predictive validity)
- ❌ Enneagram
- ❌ Astrology / zodiac
- ❌ "Manifestation" / "law of attraction"
- ❌ Human Design
- ❌ Blood-type personality
- ❌ DISC (some validity, but weak; avoid as primary)
- ❌ StrengthsFinder as a personality type system (works as input, not type)
- ❌ "Morning person vs. night owl" as a fixed identity (it shifts; use chronotype data)
- ❌ Affirmations for behavior change (mild benefit; use implementation intentions instead)
- ❌ Vision boards for goal attainment (correlation, not causation)
- ❌ Multi-level marketing "mindset" content

**Rule of thumb:** if the claim sounds "woo," asks you to identify with a type, or promises transformation without effort — skip it. If the claim comes with a research citation, a number, or a mechanism — use it.

## Plan generation (the core)

### The 5-step daily plan

1. **Pick 1–3 MITs** (Most Important Tasks) from the backlog — small number, hardest/most-valuable first ("eat the frog").
2. **Phrase each as an implementation intention:** "When [cue], I will [action]" — contingent triggers beat fixed times (Gollwitzer; d ≈ 0.65). Cue = an existing anchor ("after breakfast", "when I open the laptop", "after I read the daily note").
3. **Time-block the #1 MIT** in a peak-energy window: 60–90 min deep block, then a 20–30 min screen-free break (ultradian rhythm; vigilance drops ~20–30 min).
4. **One habit stacked per anchor:** "After [existing habit], I will [tiny habit]" with a 2-minute fallback for bad days (Fogg B=MAP; keep the chain alive).
5. **Keep the day small enough for the worst day** — a plan you can do on a hard day beats a perfect plan you break (minimum viable daily session).

### The "minimum viable day"

On your worst day, what can you still do? **Define it explicitly** so you have a "floor" to fall back to.

| Tier | What it looks like | When |
|---|---|---|
| **Full day** | All 3 MITs + all stacked habits | Normal days |
| **Reduced day** | 1–2 MITs + the most important habit | Sick, travel, low energy |
| **Minimum viable** | 1 tiny version of the most important habit, no MITs | Crisis, illness, family emergency |

**The minimum viable day is a feature, not a failure.** It keeps the chain alive.

### Plan when you're overwhelmed

- **Brain dump** (5 min) — list everything on your mind
- **Sort** — what's a MIT, what's nice-to-have, what can wait
- **Pick 3 MITs** max
- **Drop everything else** (write it down for later; permission granted)
- **Schedule the first MIT** with implementation intention

## Daily plan template (drop into your daily note)

```markdown
# YYYY-MM-DD — {day of week}

## Today in one line
{thesis of the day; the single outcome that makes it a win}

## MITs (1–3)
1. [ ] **{MIT 1 as implementation intention}**
   - "When [cue], I will [action]"
   - Deep block: {HH:MM–HH:MM} ({energy: peak/normal/low})
2. [ ] **{MIT 2}** — {when}
3. [ ] **{MIT 3}** — {when}

## Habits (stacked)
- After [anchor 1], I will [habit A] (2-min fallback: {tiny version})
- After [anchor 2], I will [habit B]

## Schedule
- 09:00–10:30 Deep work: MIT 1
- 10:30–11:00 Walk / no-screen break
- 11:00–12:00 Meetings / shallow work
- 12:00–13:00 Lunch
- 13:00–14:30 Deep work: MIT 2
- 14:30–15:00 Walk / no-screen break
- 15:00–17:00 Shallow work + email + admin
- 17:00+ Wrap + reflection + next-day prep

## Meetings & hard blocks
- {time} — {meeting} (or block)

## Inbox (capture; organize later)
- {anything; tag with #to-process for next-week review}

## Shallow work / admin
- [ ] Reply to {important email}
- [ ] {small task}

## Reflection (end of day, 5 min)
- What went well? (specific)
- What didn't? (specific)
- One thing I'd do differently tomorrow
- Energy level today (1–5):
- Tomorrow's #1 MIT:

## Tomorrow's prep (5 min, before close)
- {first action tomorrow}
- {first meeting / blocker}
```

## Goal setting (SMART + OKRs)

### SMART (for tasks / projects)

**Specific** (not "lose weight" but "lose 4 kg in 12 weeks")
**Measurable** (track the number, not the feeling)
**Achievable** (within reach with effort, not fantasy)
**Relevant** (aligned with your bigger goals)
**Time-bound** (by when — date, not "soon")

### OKRs (for quarterly / annual goals)

- **Objective** — qualitative, inspiring, ambitious
- **Key Results** — 3–5 measurable outcomes that prove the objective

**Example:**
- **O:** Become the go-to person for Nepal fintech analysis
  - **KR1:** Publish 12 deep-research reports (1/week) by EOY
  - **KR2:** Grow newsletter to 1,000 subscribers
  - **KR3:** Land 3 paid advisory clients

**Rule:** OKRs should feel uncomfortable (70% completion = good). SMART goals should feel achievable (90%+ completion).

### Goals + identity (the extra lever)

- **"Eat the frog"** is a tactic; **"I am someone who does hard things first"** is identity
- **Process identity** ("I am a runner") beats outcome identity ("I run marathons")
- Identity-based change: **small wins** that prove the identity, not heroic efforts that don't repeat

## Prioritization (Eisenhower + RICE)

### Eisenhower matrix (2026 reimagined)

|  | **Urgent** | **Not urgent** |
|---|---|---|
| **Important** | **Do now** (or delegate) | **Schedule** (deep work) |
| **Not important** | **Delegate to AI** (the modern add) | **Delete / park** |

**2026 update:** the "Not important + Urgent" quadrant is now "delegate to AI" — let the agent handle the routine.

### RICE scoring (for features / one-off decisions)

- **R**each (how many people affected per quarter)
- **I**mpact (3=massive, 2=high, 1=medium, 0.5=low, 0.25=minimal, 0=none)
- **C**onfidence (100% / 80% / 50%)
- **E**ffort (person-weeks)

**Score = (R × I × C) / E.** Higher = do first.

### When to use what

- **Eisenhower** for the day's tasks
- **RICE** for prioritizing 5+ candidate projects/features
- **Weighted decision matrix (Pugh)** for binary big decisions (use `business-planning`)

## Energy curve & chronotype

### Chronotype (morning / evening type)

- ~25% of adults are clear morning types
- ~25% are clear evening types
- ~50% are intermediate

**Find your type with data, not self-image.** Track energy every 2 hours for 2 weeks; plot the curve.

### How to use the curve

- **Peak hours** (top quartile of energy) → most important MIT
- **Trough hours** (bottom quartile) → shallow work, email, admin
- **Medium hours** → meetings, collaborative work

### The "if I only have 2 hours" rule

- 2 peak hours > 4 trough hours
- 1 continuous 90-min block > 3 scattered 30-min blocks

### Common chronotype patterns (verify with your own data)

| Type | Peak | Trough | Note |
|---|---|---|---|
| Morning | 6am–12pm | 1pm–4pm | Standard "9-to-5" aligned |
| Intermediate | 9am–1pm, 4pm–7pm | 2pm–3pm | Most flexible |
| Evening | 4pm–10pm | 6am–10am | Schedule MIT after lunch |

## Habit formation & breaking

### The 4 laws of behavior change (Fogg / Clear)

1. **Cue** — make it obvious (visible trigger, time, place)
2. **Craving** — make it attractive (pair with something you enjoy)
3. **Response** — make it easy (2-minute version, reduce friction)
4. **Reward** — make it satisfying (track the streak, immediate reward)

### Habit stacking (the practical lever)

**Template:** "After [CURRENT HABIT], I will [NEW HABIT]."

Examples:
- After I pour my morning coffee, I will meditate for one minute.
- After I sit down at my desk, I will open the most important note.
- After I close my laptop for the day, I will write 3 things I shipped.

### 2-minute rule (the floor)

- Any habit can be started with a 2-minute version
- The goal is to **establish the cue**, not to do the whole thing
- Once the 2-min version is automatic, expand

### Habit tracking

- **Visible** beats hidden (calendar on wall, streak app, paper)
- **Don't break the chain** (Jerry Seinfeld method)
- **Never miss twice** (Lally; one miss is data, two is a new pattern)
- **Track 1–3 chains max** (more = noise)

### Breaking a bad habit

1. **Make it invisible** (remove the cue)
2. **Make it unattractive** (reframe)
3. **Make it difficult** (add friction)
4. **Make it unsatisfying** (accountability, commitment device)

### Habit anti-patterns

- ❌ Setting 5 new habits at once (do 1 at a time)
- ❌ Big daily time commitment (start 2-min)
- ❌ No defined cue ("I'll meditate" without "after I...")
- ❌ No tracking
- ❌ Punishing a miss (instead: log it, keep going)
- ❌ Replacing the habit with nothing (always have a substitute ready)

## Consistency management

> **The goal is not perfection. The goal is "never miss twice" + recovery speed.**

- **Never miss twice.** One missed day does not break automaticity; two starts a new pattern.
- **Track 1–3 chains max.** Visible tracking > hidden; ≈ expected payoff.
- **Reward the showing up, not the outcome.** Never penalize a missed day with guilt — log it as a data point.
- **Have a "minimum viable day" defined** for crises.
- **Pre-plan recovery** (Sunday: what will I do if Monday is bad?)
- **Review weekly** — adjust before drift compounds.

## Weekly review (30 min, Sunday)

### The 5-step weekly review

1. **Look back** (10 min)
   - What shipped this week? (specific list)
   - What didn't ship that should have? Why?
   - What surprised me?
2. **Look at the data** (5 min)
   - Habit chains: count of breaks
   - Energy curve: how was each day?
   - Wins log
3. **Look forward** (10 min)
   - Top 3 MITs for next week (specific)
   - Big rocks / hard blocks scheduled
   - What to drop, what to add
4. **Tidy the loops** (3 min)
   - Inbox zero for personal system
   - Open loops: write down, schedule, or delete
5. **Set up next week** (2 min)
   - Monday's first action
   - Hard blocks on calendar
   - Any pre-work needed

### Monthly review (additions)

- Goals progress: are you on track?
- Identity check: is the work aligned with who you want to be?
- Triage the project list: what to keep, drop, defer
- One experiment to try next month

## Reflection & journaling

### "Three Good Things" (Seligman)

- **Frequency:** 1–3×/week (not daily — habituation)
- **Prompt:** "What went well today? Why? What role did you play?"
- **Specificity** matters more than positivity
- **Write it down** (paper or note)

### Evening reflection (5 min)

- What went well today? (specific)
- What didn't? (specific, not guilty)
- One thing I'd do differently tomorrow
- Energy level (1–5)
- Tomorrow's #1 MIT

### Expressive writing (Pennebaker)

- 15–20 min, 3–4 sessions
- Write about a stressor or emotional event
- Continuous prose, no editing
- Proven to reduce stress + improve health outcomes

### What to skip

- ❌ Gratitude lists done out of duty (no mechanism, no benefit)
- ❌ "Manifestation" journals
- ❌ Stream-of-consciousness as a daily habit (expensive; use only when needed)

## Burnout prevention & recovery

### Burnout signs (Maslach)

- **Exhaustion** (physical + emotional)
- **Cynicism / detachment** (don't care anymore)
- **Inefficacy** (no sense of accomplishment)

### Prevention

- **Sleep 7–9 hours** (non-negotiable; the #1 productivity lever)
- **Movement daily** (20+ min, anything)
- **Social connection** (real, not just chat)
- **One thing per day that isn't work** (recreation is fuel, not reward)
- **Set boundaries** (no notifications after X, no email on weekends)
- **Vacations** (real ones, with no work; 2–4× per year minimum)

### Recovery from a stretch (5-step)

1. **Acknowledge** — log the bad days as data, not failure
2. **Reduce the plan** — minimum viable day for a week
3. **Protect sleep + movement** — the foundation
4. **Reconnect** — one person, one activity, one non-work thing
5. **Don't try to "make up for it"** — slow rebuild beats heroic restart

### When to take a real break

- 2+ weeks of declining energy
- Loss of interest in things you used to enjoy
- Sleep disruption that lasts 2+ weeks
- Decision fatigue so bad you can't pick a meal

**Take the break. The work will be there. You won't be, if you don't.**

## Learning & spaced repetition

### The forgetting curve (Ebbinghaus)

- Without review, you forget ~70% in 24 hours, ~90% in a week
- **Spaced repetition** fights this: review at increasing intervals
- **Active recall** beats re-reading (write from memory)

### Spaced repetition app algorithms

- **Anki (SM-2)** — classic, free, 2-sided cards
- **FSRS** — modern, more efficient than SM-2, open source
- **RemNote** — note-taking + SRS in one
- **Obsidian + Spaced Repetition plugin** — vault-native

### Spaced repetition pattern

- **Day 0:** learn it
- **Day 1:** review
- **Day 3:** review
- **Day 7:** review
- **Day 14:** review
- **Day 30:** review
- **Day 90:** review
- Then: occasional refresh

**The gap ≈ 10–20% of the retention interval** is the rule of thumb.

### How to make good cards

- **One idea per card** (atomic)
- **Cue → recall** (front is a question, back is the answer)
- **Use images** where applicable
- **Apply, don't just define** ("When would you use X?" beats "What is X?")

### Learning a skill vs. learning facts

- **Facts** → SRS (Anki, FSRS)
- **Skills** → deliberate practice (focused, feedback, gradual difficulty)
- **Concepts** → teach it (Feynman technique)

## Project planning

### The 3-tier project

- **Big project** (3–12 months) — strategic; review monthly
- **Mini-project** (1–4 weeks) — tactical; review weekly
- **Task** (today / this week) — operational; review daily

### Project plan template

```markdown
# Project: {name}

## Outcome (1 sentence)
{what success looks like, in 1 sentence}

## Why now?
{why this is worth doing now}

## Big rocks
- {major deliverable 1} — by {date}
- {major deliverable 2} — by {date}

## Risks & mitigations
- {risk} → {mitigation}

## First 3 actions
1. {first concrete step}
2. {second}
3. {third}

## When to kill
{triggers that mean "this isn't working; stop"}
```

## How an AI agent should generate plans

> **This is the meta-section.** If you're an AI agent writing a plan for a human, follow these rules.

### What an AI plan should do

- **Be specific** (not "be more productive" but "after I open the laptop, I will read the daily note")
- **Be time-bound** (not "soon" but "by 14:00 today")
- **Be one screen** (don't dump 20 tasks; pick 1–3 MITs)
- **Match the user's context** (their energy, their schedule, their current state)
- **Have a fallback** (minimum viable day)
- **Be saved** (write to the daily note in the vault)
- **Be reviewed** (end-of-day reflection prompt)

### What an AI plan should NOT do

- ❌ Add 10 new tasks to the backlog
- ❌ Pretend to know the user's energy (ask or use data)
- ❌ Generate "motivation" content (action > motivation)
- ❌ Use pseudoscience (see no-pseudoscience rule)
- ❌ Re-plan mid-day without checking
- ❌ Suggest 2-hour deep blocks when the user has 30 minutes between meetings
- ❌ Skip sleep, food, or movement
- ❌ Promise a transformation in 30 days

### The "read before write" rule

Before generating a plan, **read:**
1. The current daily note (what's already in progress?)
2. The recent daily notes (what's the pattern? what worked?)
3. The active project list (what's the highest-priority project?)
4. Any user state (tired, sick, in crisis?)

### The "save after write" rule

After generating a plan, **save it to the daily note** in the vault (via `with-context` MCP). The plan is worthless if it lives in chat history.

### The "check in mid-day" rule

For long-running plans, the agent should **checkpoint** at the natural break (post-MIT-1, post-lunch). Update the plan, not rewrite it.

### When to push back on the user

- **"I want to do 8 MITs today"** → 3 max
- **"I'll do a 4-hour deep block"** → that's not a real block; break into 90-min chunks
- **"I don't need sleep"** → yes you do
- **"I'll just power through"** → no; the cost shows up tomorrow

## Time-blocking patterns

### Deep work block (60–90 min)

1. **Close all distractions** (notifications off, phone in another room)
2. **Single task** (one MIT, no tab switching)
3. **90-min max** (after this, vigilance drops)
4. **20–30 min break** (walk, water, no screens)
5. **Repeat** (or shift to shallow work)

### Shallow work block (30–60 min)

- Email, admin, messages
- Meetings
- Light coordination

### Recovery block (10–20 min)

- Between deep work sessions
- After meetings
- Mid-afternoon energy trough

### Calendar pattern (the "default week")

```
MORNING   : Deep work (1–2 blocks of 90 min)
MIDDAY    : Meetings, collaboration
AFTERNOON : Deep work (1 block) + shallow (email, admin)
LATE PM   : Wrap-up, tomorrow's prep, hard stop at a set time
WEEKEND   : Personal + recovery + optional 1 block of strategic work
```

**Hard stop:** a defined end time. The work expands to fill the time available; cap it.

## Calendar & focus mode integration

### Calendar as the truth

- **Everything scheduled** (deep work, breaks, meetings, admin) — what gets scheduled gets done
- **Color-code** by type (deep / shallow / meeting / personal / break)
- **Time-block** before the day starts, not as you go

### Focus modes (use them)

- **macOS Focus** (Work / Personal / Sleep / Do Not Disturb)
- **Windows Focus / GNOME Do Not Disturb**
- **Phone** (most important — phone is the biggest distraction)
- **Browser extensions** (LeechBlock, uBlock, etc.)

### Inbox management

- **One inbox per channel** (email, Slack, GitHub, etc.) — unify where possible
- **Process rules:** delete / delegate / do (≤2 min) / schedule / defer
- **Schedule a daily inbox sweep** (15 min, after a deep block, not first thing)

## Tools in our stack (recommendations)

> **The skill is tool-agnostic. Pick the tools that fit your style; switch if they don't.**

### Task / project management

- **Linear** — modern, fast, for product/eng work
- **Notion** — flexible, all-in-one (overkill for many)
- **Things 3** — Mac/iOS only, beautifully simple
- **Todoist** — cross-platform, fast
- **Obsidian Tasks plugin** — for vault-native task management
- **Apple Reminders** — free, simple, on every device
- **Pen + paper** — for some people, the best tool

### Habit tracking

- **Streaks** (iOS) — beautiful, simple
- **Habitica** — gamified
- **Beeminder** — commitment device (pays if you miss)
- **Loop Habit Tracker** (Android) — open source
- **Paper calendar** — Jerry Seinfeld method, works

### Calendar

- **Google Calendar** — universal
- **Apple Calendar** — for Apple users
- **CalDAV** (Nextcloud, Radicale) — self-hosted
- **Fantastical** — Mac, natural-language input

### Time tracking (optional)

- **Toggl** — simple, free
- **Clockify** — free
- **RescueTime** — automatic
- **Orion / Beeminder** — for commitment devices

### Focus

- **macOS Focus** (built-in) or **Opal**
- **Cold Turkey** (blocker, paid)
- **Freedom** (multi-device)
- **LeechBlock** (browser)
- **1Password** (with time-based unlock for "after work")

## Helpful suggestions (the agent's job)

When the user asks for a plan, motivation, or self-development help:

- **One forward-looking and one incremental suggestion per plan** ("tomorrow's #1 task", "continue the chain")
- **Predict day shape**: energy curve, load, meetings, distraction risk
- **Plan recovery** after hard days
- **Convert personality/mind questions to behaviors** (evidence, not traits)
- **Never offer affirmations** as a substitute for action
- **Use implementation intentions** when the user wants a new habit
- **Use spaced repetition** when the user is learning

## Guardrails / anti-patterns

- ❌ Schedule >3 MITs or stack >1–3 chains
- ❌ Use fixed-clock tasks for motivation-critical habits (always bind to a cue)
- ❌ Generate filler "self-develop" content (affirmations with no behavior)
- ❌ Recommend cold-turkey overhauls (incremental progress wins)
- ❌ Skip sleep, food, or movement in the plan
- ❌ Re-plan the day mid-day without checking what was actually done
- ❌ Use MBTI / Enneagram / astrology as a basis for anything
- ❌ Promise transformation in 30 days
- ❌ Use "manifestation" or "law of attraction" language
- ❌ Add 5 new habits at once
- ❌ Punish a missed day with guilt
- ❌ Define the "best" morning / evening routine (there isn't one)

## Related skills

- `notetaking-brain` (vault + daily notes), `domain-orchestrator` (routing), `business-planning` (Nepal work), `development-workflows` (build projects), `lemma` (persist insights)
