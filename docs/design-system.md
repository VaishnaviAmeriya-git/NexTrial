# NexTrial Design System & Guidelines

## 1. Design Philosophy
NexTrial employs a **GIGW-inspired (Guidelines for Indian Government Websites)** design system targeted at **WCAG 2.1 AA** compliance. The visual language is clean, institutional, reliable, and functional, prioritizing ease of use for clinical coordinators, principal investigators, ethics committee members, and pharmacovigilance officers in Indian clinical research settings.

> [!NOTE]
> NexTrial is an academic prototype using synthetic data. It is not an official Government of India or AIIA portal. No official national emblems or copyrighted seals are used.

---

## 2. Color Palette & Tokens

All tokens are defined in `tailwind.config.js` and CSS variables.

| Token Key | Hex Value | Semantic Role |
| :--- | :--- | :--- |
| `primary` | `#1F3A5F` | Primary Navy: Top header, primary action buttons, links |
| `primary-hover` | `#16304F` | Navy Hover state |
| `secondary` | `#2F6DB5` | Active tab indicator, focused interactive ring, secondary actions |
| `saffron` | `#E8892B` | Saffron Accent: 4px top utility strip, active sidebar indicator, key metric badges |
| `bg-page` | `#F5F7FA` | Canvas/page background |
| `bg-surface` | `#FFFFFF` | Card surfaces, modals, table backgrounds |
| `border-subtle` | `#D0D7DE` | Standard container borders, table dividing lines, input borders |
| `text-main` | `#1B1F23` | High-contrast body text (meets >= 4.5:1 contrast against `#F5F7FA`) |
| `text-muted` | `#4A5560` | Secondary metadata, helper labels, table column headers |

### Status Colors (Always Icon + Text)
Status indicators must **never rely on color alone**. They must always be paired with an explicit icon and text label.

| Status | Hex | Token | Standard Icon |
| :--- | :--- | :--- | :--- |
| **Success** | `#1E7B45` | `status-success` | `✔` or CheckCircle |
| **Warning** | `#B26A00` | `status-warning` | `⚠` or AlertTriangle |
| **Danger** | `#B3261E` | `status-danger` | `✖` or AlertCircle |
| **Info** | `#2F6DB5` | `status-info` | `ℹ` or Info |

---

## 3. Typography & Sizing

- **Font Family**: `Noto Sans`, system-ui, -apple-system, sans-serif. Supports Devanagari script for bilingual accessibility.
- **Body Text**: 16px minimum (`text-base`), line-height 1.5 (`leading-relaxed`).
- **Headings**:
  - `H1`: 24px (`text-2xl`), font-semibold, navy `#1F3A5F`. Exactly one H1 per page.
  - `H2`: 20px (`text-xl`), font-semibold.
  - `H3`: 18px (`text-lg`), font-medium.
- **Text Sizing Utility**:
  - `A-` (Normal - 2px, base 14px)
  - `A` (Default base 16px)
  - `A+` (Enlarged + 2px, base 18px)
- **Language Toggle**: EN / हिन्दी toggle switches navigation and title strings.

---

## 4. UI Shell / Page Frame

Every authenticated screen features:
1. **Top Saffron Strip**: 4px height bar `#E8892B`.
2. **Persistent Notice Bar**:
   `"Prototype - synthetic data. Academic project, not an official Government of India website."`
3. **Utility Bar**:
   - Skip to main content link (`#main-content`)
   - Text size controls (`A-`, `A`, `A+`)
   - Language switch (`EN` / `हिन्दी`)
   - Current user info: `Name (Role)` + `Sign Out` button
4. **Header Banner**:
   - Neutral circular caduceus/leaf emblem (placeholder)
   - Title: **NexTrial**
   - Subtitle: *Clinical Trial Management System for Ayurvedic Research*
5. **Navigation Sidebar**:
   - 240px wide navy (`#1F3A5F`) sidebar with white text
   - Active route has saffron left accent border (4px)
   - Menu items filtered strictly by user role
6. **Breadcrumb Bar**:
   - Placed immediately under the header: e.g. `Home > Trials > NT-KNEE-01 > Participants`
7. **Footer**:
   - Links: Help, Accessibility Statement, Terms, Contact
   - Metadata: Last Updated date, App Version (v1.0.0), ML Model Version (v1.0-rf)
   - Official disclaimer text

---

## 5. Component Specifications

- **Buttons**:
  - Rectangular with 4px border-radius (`rounded-[4px]`).
  - Height minimum 40px (`h-10 px-4`), minimum 44px on touch devices.
  - Focus ring: 3px solid `#2F6DB5` with 1px outline offset.
- **Forms**:
  - Labels placed above input fields.
  - Required fields marked with `*` and text `(required)`.
  - Inline error messages in plain language.
  - Step-by-step wizard for participant intake (Step 1: Basic Info, Step 2: Ayurveda Dosha/Prakriti, Step 3: Consent & Arm).
- **Tables**:
  - Zebra striping (`odd:bg-white even:bg-slate-50`).
  - Sticky header with sortable indicators.
  - Explicit `View` / `Edit` button links (no hidden icon-only actions).
  - Search and filter bar above table, pagination (10 / 25 / 50 rows) below.
- **Badges**:
  - Must pair icon + text (e.g., `▲ High Risk`, `● Medium Risk`, `▼ Low Risk`, `✔ Active`, `⚠ IEC Expiring`).
- **Trial Health Score Gauge**:
  - Visual semi-circle meter with bands: $\ge 80$ Green, $60-79$ Amber, $< 60$ Red.
  - Detailed 5-term breakdown table displaying Enrollment (E), Retention (R), Compliance (C), Safety (S), and Quality (Q) with raw values, weights, and points contribution.
- **Risk Card**:
  - Probability percentage, risk band badge.
  - Top 3 SHAP drivers visualized as horizontal progress bars with direction indicators.
  - 2-3 actionable clinical next steps (e.g. "Schedule adherence call", "Coordinate travel assistance").
  - Clear disclaimer: *"Decision support only. Not a clinical decision."*
  - Fallback state: *"Prediction unavailable"* if ML service is unreachable.
