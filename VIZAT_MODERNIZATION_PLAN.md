# Vizat Modernization Plan

> Operation Glasshouse · Phase 1 shipped in demo · 2026-06-17

---

## Current state

| Layer | Status |
|-------|--------|
| **Library (`src/`)** | Render-only Canvas 2D — shapes, gradients, text |
| **Playground** | Was static demo + dark inline CSS |
| **Interactions** | None in core library |
| **Deploy** | `vizat.vercel.app/playground` **200** |

**Problem:** Interesting tech, sandbox presentation — not a modern visual platform.

---

## Target experience

Reference principles (not clones): **Figma** (precision), **tldraw** (approachable canvas), **Linear** (density + polish), **Vercel Dashboard** (light SaaS chrome).

Playground should feel: professional, creative, fast, premium, **light theme first**.

---

## Architecture decision: preserve core, layer interactions

```
┌─────────────────────────────────────┐
│  Playground UI (demo/)              │  ← toolbar, panels, light theme
├─────────────────────────────────────┤
│  Interaction layer (demo/interaction)│  ← drag, select, snap (Phase 1 ✅)
├─────────────────────────────────────┤
│  Vizat core (src/)                  │  ← render-only, unchanged API
└─────────────────────────────────────┘
```

Do **not** bloat `Canvas.ts` with pointer logic until interaction API is designed.

---

## Phase 1 — Shipped ✅

| Item | Deliverable |
|------|-------------|
| Light playground chrome | `demo/playground.css`, updated `playground.html` |
| Drag + select + snap 8px | `demo/interaction.ts` |
| Add rectangle | Toolbar button |
| Design system doc | `VIZAT_DESIGN_SYSTEM.md` |

---

## Phase 2 — Playground productization

| # | Task | Priority |
|---|------|----------|
| 1 | Resize handles (8-point bbox) on selected shapes | P0 |
| 2 | Multi-select (shift+click, marquee) | P0 |
| 3 | Layers panel (reorder `items[]`, z-index) | P1 |
| 4 | Properties inspector (x, y, w, h, fill, stroke) | P1 |
| 5 | Pan + zoom viewport | P1 |
| 6 | Align / distribute tools | P2 |
| 7 | Monaco live code panel (per SLICES.md) | P1 |
| 8 | Export PNG / JSON scene | P2 |

---

## Phase 3 — Library API (optional)

| API | Purpose |
|-----|---------|
| `SceneNode` id + metadata | Stable references for interaction |
| `canvas.toJSON()` / `fromJSON()` | Save/load |
| `HitTest` plugin | Point-in-shape for all primitives |
| `InteractionManager` | Optional package `@vizat/interaction` |

---

## Phase 4 — Landing alignment

| Task | Notes |
|------|-------|
| Light theme on `public/index.html` | Match playground ivory/indigo |
| Playground screenshot on landing | Show drag UX |
| Favicon | SLICES.md todo |

---

## Non-half-ass gate

| Criterion | Status |
|-----------|--------|
| Playground light theme | ✅ |
| Drag shapes | ✅ |
| Resize | ❌ Phase 2 |
| Multi-select | ❌ |
| Layers UI | ❌ |
| Landing ↔ playground consistency | 🟡 |
| Mobile touch tested | 🟡 |

---

## Files

| Path | Role |
|------|------|
| `demo/playground.html` | Playground shell |
| `demo/playground.css` | Light design tokens |
| `demo/main.ts` | Scene + render loop |
| `demo/interaction.ts` | Pointer layer |
| `src/Canvas.ts` | Core scene list |
| `VIZAT_DESIGN_SYSTEM.md` | Tokens + rules |
