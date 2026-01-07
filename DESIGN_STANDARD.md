# CreationHub Dashboard: Design Standard & Visual Style Guide (v2.5)

**Status**: APPROVED / FROZEN
**Version**: 2.5 (Harmonized)
**Reference**: `final_harmonized_style.png`

> **CRITICAL INSTRUCTION FOR AI AGENTS**:
> This document is the SINGLE SOURCE OF TRUTH for the dashboard's visual appearance.
> DO NOT DEVIATE from these rules. Any visual change must be explicitly requested by the user.
> If asked to "fix" something, check this standard first.

---

## 1. The "Golden Rule" of Component Style
All interactive widgets and panels (Service Cards, Activity Log, Disk Usage) MUST mimic the **Network Monitor Inner Cards**.

**CSS Specification**:
- **Background**: `bg-muted/50` (Transparent Grey)
- **Border**: `border border-border` (Subtle)
- **Radius**: `rounded-lg` (Standard)
- **Hover**: `hover:border-primary/30` or `hover:bg-emerald-500/10`
- **Padding**: `p-3` or `p-4`

**❌ DO NOT USE**:
- Large opaque cards (`bg-card`) for top-level stats.
- Heavy dropshadows.
- `rounded-xl` (unless strictly necessary for large containers).

---

## 2. Layout Structure (The "Hybrid" Model)

### Top Row: "Native & Transparent"
**Components**: Server Info, VPN Location, Network Monitor.
- **Container**: **TRANSPARENT**. No visible background or border around the main component.
- **Inner Items**: Styled using the **Golden Rule** (small cards inside the transparent container).
- **Visual Effect**: Widgets appear to "float" on the dashboard background.

### Bottom Row: "Structured & Visible"
**Components**: Services Grid, Activity Log, Disk Usage.
- **Visibility**: MUST be visible on the main Dashboard page.
- **Container**: Styled using the **Golden Rule**. They look like "Panels" or "Buttons".
- **Position**: Grid layout at the bottom.

---

## 3. Color Palette (Strict)

- **Theme**: "Modern Emerald/Slate"
- **Primary Accent**: Emerald (`text-emerald-400`, `bg-emerald-500`) - Used for "ON" states, Network, connectivity.
- **Secondary Accent**: Blue (`bg-blue-500`) - **STRICTLY RESERVED** for **Disk Usage Bars** (System C:).
- **Background**: Dark Slate (`bg-background`).
- **Text**:
    - Primary: `text-foreground` (White/Off-white)
    - Muted: `text-muted-foreground` (Grey)

---

## 4. Typography & Badges

- **Service Status Badges**:
    - **ONLINE**: `bg-success/50 text-white` (High Contrast).
    - **OFFLINE**: `bg-destructive/50 text-white`.
    - **Font**: Small, Caps or clear text.
- **Metrics**:
    - **Values**: `text-lg` or `text-xl` + `font-bold`.
    - **Labels**: `text-xs` + `text-muted-foreground`.

---

## 5. Reference Screenshot
*(See `final_harmonized_style.png` in artifacts)*

**Checklist for Future Sessions**:
1. [ ] Are Top Row containers transparent?
2. [ ] Do Services look like Network buttons?
3. [ ] Is the Disk Bar Blue?
4. [ ] Is the Activity Log visible?

**IF "NO" TO ANY → REVERT TO THIS STANDARD IMMEDIATELY.**
