# Visual Design Guidelines

> Target design system for the next frontend refresh.

---

## Overview

This document defines the **target** UI language for the user-facing frontend refresh.

Direction:

- Telegram-inspired information hierarchy
- productivity-tool clarity
- soft panel depth instead of hard dashboard chrome
- motion used as feedback, not decoration

This is **not** a Telegram clone. The goal is to borrow the strengths of Telegram's chat workspace:

- instant scanability
- clear current-context focus
- fluid panel transitions
- tactile micro-interactions

while preserving the identity of a mail utility product.

---

## Design Decision: Telegram-Inspired Mail Workspace

**Context**: The current UI is functional but visually flat. Navigation, mail list, and detail view are present, but the hierarchy feels closer to a generic admin/productivity shell than a focused message workspace.

**Options Considered**:

1. Keep the current dashboard-style visual system and only polish spacing
2. Rebuild the app as a Telegram-like chat clone
3. Adopt Telegram-inspired hierarchy, motion, and panel treatment while keeping the mail-tool structure

**Decision**: Choose option 3.

**Why**:

- Email and chat both benefit from list-detail reading flow
- the existing `MailBox.vue` structure already maps well to a conversation workspace
- a full chat clone would misrepresent email semantics and reduce product trust

**Extensibility**:

- the same design language can be reused by inbox, sent mail, address management, and admin list-detail screens
- motion tokens and panel tokens can be applied incrementally without rewriting all screens at once

---

## Core Visual Principles

- Make the **mail list** feel like the center of gravity, not a secondary table.
- Make the **active context** obvious through surface, border, and motion, not only color.
- Use **cool blue + slate** as the primary emotional register.
- Keep surfaces soft and dense, not loud or glossy.
- Prefer **one calm accent** over many competing colors.
- Use animation only to explain focus, selection, reveal, refresh, and panel transitions.

---

## Token Contract

All new visual work should extend the existing `--ds-*` token system in `frontend/src/assets/design-system.css`.

### Typography

Primary target family:

- UI/Heading: `Plus Jakarta Sans`
- Fallback: `-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`

Why:

- closer to Telegram's calm, human, modern feel than the current Inter stack
- easier to read in compact list/detail interfaces than code-flavored pairings like Fira Code

Contract:

- Use one family for most product UI
- Do not introduce decorative serif display fonts into inbox, settings, or admin shell views
- Reserve monospace only for API keys, IDs, code blocks, and machine-readable values

Target scale:

- Page title: `22-24px / 700`
- Section title: `18-20px / 700`
- Sender/title in list rows: `14-15px / 600`
- Body UI text: `14px / 1.5`
- Secondary/meta text: `12-13px / 1.45`
- Mobile body minimum: `16px` for editable inputs and primary reading surfaces

### Color Tokens

Recommended target values:

```css
:root {
  --ds-font: "Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --ds-primary: #2F6FED;
  --ds-primary-hover: #255FDC;
  --ds-primary-soft: #DCE8FF;
  --ds-accent: #22C55E;
  --ds-bg: #F5F8FC;
  --ds-bg-muted: #EEF3F9;
  --ds-surface: #FFFFFF;
  --ds-surface-soft: #F7FAFD;
  --ds-surface-active: #EAF2FF;
  --ds-border: #D8E2EE;
  --ds-border-strong: #C6D3E1;
  --ds-text: #12263F;
  --ds-text-secondary: #53657A;
  --ds-text-muted: #7B8B9D;
  --ds-success: #22C55E;
  --ds-warning: #F59E0B;
  --ds-danger: #EF4444;
}

.dark {
  --ds-primary: #60A5FA;
  --ds-primary-hover: #7AB7FF;
  --ds-primary-soft: rgba(96, 165, 250, 0.18);
  --ds-bg: #0C1522;
  --ds-bg-muted: #111D2C;
  --ds-surface: #142133;
  --ds-surface-soft: #19283D;
  --ds-surface-active: #1D3557;
  --ds-border: #24364B;
  --ds-border-strong: #34506E;
  --ds-text: #EAF2FF;
  --ds-text-secondary: #A6B8CF;
  --ds-text-muted: #7E91A8;
}
```

Rules:

- Use blue for focus, selection, navigation, and current-context emphasis
- Use green for success/live state only
- Use orange only for explicit CTA or warnings, not as a second primary brand color inside inbox flows
- Maintain at least 4.5:1 contrast for normal text

### Shape And Depth

Target shape:

- panel radius: `16px`
- inner control radius: `10-12px`
- row active pill radius: `12-14px`

Depth rules:

- prefer border + soft shadow over large floating shadows
- use 1 visual elevation step between adjacent panels
- use glassmorphism only for overlays, drawers, or floating controls, never for the main reading surface

Recommended shadows:

```css
--ds-shadow-sm: 0 1px 2px rgba(16, 24, 40, 0.04), 0 2px 8px rgba(16, 24, 40, 0.04);
--ds-shadow-md: 0 8px 24px rgba(15, 23, 42, 0.08);
--ds-shadow-overlay: 0 20px 60px rgba(15, 23, 42, 0.18);
```

### Motion Tokens

```css
--ds-motion-fast: 160ms;
--ds-motion-base: 220ms;
--ds-motion-slow: 320ms;
--ds-ease-standard: cubic-bezier(0.2, 0, 0, 1);
--ds-ease-emphasized: cubic-bezier(0.22, 1, 0.36, 1);
--ds-ease-exit: cubic-bezier(0.4, 0, 1, 1);
```

Rules:

- micro-interactions: `150-220ms`
- panel/detail transitions: `220-320ms`
- no UI animation longer than `500ms`
- animate only `transform`, `opacity`, `box-shadow`, and subtle background/border changes
- do not animate `width`, `height`, `top`, or `left`

Reduced motion contract:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 1ms !important;
    transition-duration: 1ms !important;
    scroll-behavior: auto !important;
  }
}
```

---

## Layout Signatures

### Desktop Mail Workspace

Target signature:

```text
| Sidebar | Mail List | Mail Detail |
```

Contract:

- sidebar width: `248-272px`
- mail list width: `360-420px` or `34-40%`
- detail panel fills remaining width
- sidebar, list toolbar, and detail header should feel like separate surfaces, not one flat page
- the detail view should have a sticky top context bar

### Mobile Mail Workspace

Contract:

- bottom navigation stays fixed
- mail list remains primary screen
- detail opens in a drawer/sheet or full-screen push view
- bottom safe area must be respected
- primary tap targets must be at least `44x44px`

### Global Shell

- `AppLayout` should feel lighter and more immersive, with content surfaces floating inside the background rather than being flush to the viewport
- `AppSidebar` should read like a conversation/account switcher rail, not a generic admin menu
- mail list and detail panels should be visibly grouped as one workspace

---

## Component Contracts

### Sidebar

- Logo/header block should be compact and calm
- active nav item should use a pill or soft active rail, not only text color
- address card should look like a status capsule
- icon-only controls must have visible hover, focus, and `aria-label`

### Mail List Row

Target hierarchy:

1. sender
2. time
3. subject
4. summary or AI/status metadata

Contract:

- row min-height: `72px` desktop, `64px` mobile
- avatar: `36-40px`
- selected row uses `--ds-surface-active` plus stronger border or shadow
- hover feedback is desktop-only and must not be the only sign of interactivity
- keep row transitions subtle; do not scale cards

### Detail Panel

- sticky header with sender, subject context, date, and action group
- content enters with a short fade/slide transition
- loading state uses skeleton or spinner inside the panel, not blank space
- attachments and AI extraction should appear as secondary cards/chips, not as random inline blocks

### Bottom Tab Bar

- active tab should feel anchored through color + indicator, not color alone
- CTA-like tabs such as Compose may use accent emphasis, but only one tab can act as CTA
- sheet/drawer transitions should use translate + fade only

---

## Motion Contracts

### Allowed Motion

- row hover: subtle background/border/shadow shift
- row selection: active pill transition
- detail open/change: `opacity + translateX(8-12px)`
- drawer/sheet open: `opacity + translateY(12-20px)`
- refresh/loading: skeleton shimmer or spinner
- stagger reveal: only for small card groups like AI insights or attachments

### Prohibited Motion

- infinite decorative animation
- parallax or scroll-jacking
- bouncing icons for primary UI
- full-page cinematic transitions between normal inbox actions
- animating every interactive element in a panel at once

### Motion Density Rule

Per view, animate **1-2 key elements maximum**:

- current context transition
- one support feedback transition

Do not animate navigation, list items, detail body, and utilities all at the same time.

---

## Scenario: Telegram-Inspired Inbox Refresh

### 1. Scope / Trigger

- Trigger: redesign inbox, sent mail, compose entry, or shared shell surfaces
- Trigger: introduce new `--ds-*` tokens for surface, focus, or motion behavior
- Trigger: refactor `MailBox.vue`, `AppSidebar.vue`, `BottomTabBar.vue`, or `AppLayout.vue`

### 2. Signatures

- CSS tokens live in `frontend/src/assets/design-system.css`
- Naive UI theme overrides live in `frontend/src/theme/index.js`
- list-detail workspace is implemented through Vue SFCs under `components/`, `layouts/`, and `views/`
- motion implementation should use CSS transitions and Vue `Transition` / `TransitionGroup`

### 3. Contracts

- New visual work must extend `--ds-*` tokens instead of hard-coding new palettes in components
- New motion work must obey the duration/easing contract above
- Every icon-only interactive element must expose an accessible name
- Hover-only affordances are insufficient for primary actions
- Inbox-family screens must preserve fast scanability before decorative styling
- Telegram inspiration must show up as hierarchy and motion, not brand mimicry

### 4. Validation & Error Matrix

| Case | Expected behavior |
|------|-------------------|
| User enables reduced motion | panel and row transitions collapse to near-instant |
| Dark mode enabled | borders and active surfaces remain visually distinct |
| Mobile viewport | no horizontal scroll, bottom bar remains unobstructed |
| Icon-only button | visible focus ring and accessible label |
| Loading list/detail state | spinner or skeleton shown instead of blank panel |
| Many animations added to one screen | reject; reduce to the 1-2 key motions rule |

### 5. Good / Base / Bad Cases

- Good: mail row hover changes background and shadow slightly, detail panel fades/slides in, bottom bar uses active indicator, all under `220ms`
- Base: static panels with cleaner spacing and improved active-state surfaces, even before motion is added
- Bad: the app copies Telegram's brand cyan, bubble chat layout, and long animated transitions everywhere

### 6. Tests Required

- Verify desktop at `1024px+` with sidebar + list + detail visible
- Verify mobile at `375px` and `430px` with bottom tab bar and detail drawer
- Verify light and dark modes for border contrast and selected-row visibility
- Verify `prefers-reduced-motion: reduce`
- Verify keyboard focus states on icon-only controls
- Verify no horizontal scroll when mail subject/sender strings are long

### 7. Wrong vs Correct

#### Wrong

```css
.mail-row:hover {
  transform: scale(1.03);
  transition: all 600ms linear;
}
```

#### Correct

```css
.mail-row {
  transition:
    transform var(--ds-motion-fast) var(--ds-ease-standard),
    background-color var(--ds-motion-fast) var(--ds-ease-standard),
    box-shadow var(--ds-motion-fast) var(--ds-ease-standard);
}

.mail-row:hover {
  transform: translateY(-1px);
  box-shadow: var(--ds-shadow-sm);
}
```

---

## Anti-Patterns

- Generic dashboard cards pasted into the inbox workspace
- Heavy glassmorphism on primary reading surfaces
- Inter/Roboto fallback everywhere without a more intentional UI font choice
- Emoji used as UI icons
- Motion that hides latency instead of explaining state
- Color-only active state without surface or border change

---

## Related

- `./component-guidelines.md`
- `./quality-guidelines.md`
- `./state-management.md`
