# Vizat Design System

> Light-first canvas studio · Operation Glasshouse · 2026-06-17

---

## Principles

1. **Canvas is hero** — chrome stays quiet; white stage, subtle border.
2. **Light by default** — no dark-by-default playground.
3. **Precision** — snap grid, visible selection, clear handles (Phase 2).
4. **Library stays render-only** — interactions live in demo/package layer until API matures.

---

## Color

| Token | Value | Usage |
|-------|-------|--------|
| `--vz-bg` | `#f8fafc` | Page background |
| `--vz-surface` | `#ffffff` | Canvas stage, header |
| `--vz-border` | `#e2e8f0` | Dividers, canvas frame |
| `--vz-text` | `#0f172a` | Primary text |
| `--vz-muted` | `#64748b` | Hints, secondary |
| `--vz-accent` | `#6366f1` | Primary actions (indigo) |
| `--vz-accent-2` | `#2563eb` | Selection overlay, links |

**Shape palette (playground):**

| Role | Fill | Stroke |
|------|------|--------|
| Primary | `rgba(37,99,235,0.15)` | `#2563eb` |
| Secondary | `rgba(234,88,12,0.12)` | `#ea580c` |
| Accent | `rgba(5,150,105,0.15)` | `#059669` |

**Avoid:** neon purple/pink dark gradients from v1 landing (migrate landing in Phase 4).

---

## Typography

- **Family:** Inter, system-ui
- **Brand:** 1.1rem / 700
- **Badge:** 0.75rem / 600 uppercase feel
- **Hints:** 0.9rem / 500 muted
- **Canvas labels:** 13px / 500

---

## Spacing

| Scale | px |
|-------|-----|
| xs | 4 |
| sm | 8 |
| md | 16 |
| lg | 24 |
| xl | 32 |

**Snap grid:** 8px (interaction layer)

---

## Radius & shadow

| Token | Value |
|-------|-------|
| `--vz-radius` | `12px` |
| `--vz-shadow` | `0 1px 3px rgba(15,23,42,0.08)` |

---

## Motion

| Interaction | Duration |
|-------------|----------|
| Button hover | 150ms border/shadow |
| Drag | Immediate (no lag) |
| Future panel open | 200ms ease |

No decorative animation on canvas data surfaces.

---

## Canvas interactions

| Rule | Implementation |
|------|----------------|
| Cursor | `grab` / `grabbing` on canvas |
| Selection | Blue dashed bbox (`#2563eb`) |
| Snap | 8px grid on drag end/move |
| Hit test | Top-most shape wins (reverse paint order) |
| Redraw | Full scene redraw + overlay pass |

---

## Component rules (playground chrome)

| Component | Style |
|-----------|--------|
| **Header** | Sticky white, bottom border |
| **Toolbar** | `#f1f5f9` strip, actions right |
| **Buttons** | 8px radius; primary = indigo fill |
| **Canvas frame** | White surface, 1px border, min 68vh |

---

## File map

| File | Role |
|------|------|
| `demo/playground.css` | Playground tokens |
| `demo/playground.html` | Layout |
| `demo/interaction.ts` | Pointer layer |
| `public/styles.css` | Landing (still dark — align in Phase 4) |
