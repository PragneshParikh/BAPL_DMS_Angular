# BGAUSS B2C DMS – AutoDash UI theme (Velzon Angular)

## Install (2 min)
1. Back up `src/assets/scss` in BAPL_DMS_Angular.
2. Replace it with the `scss` folder from this zip (same structure; only 7 files differ).
3. `ng serve` – no angular.json change needed (bootstrap.scss / icons.scss / app.scss already wired).
4. Revert anytime: comment out `@import "./bgauss-autodash";` at the end of `app.scss`.

## Files changed
| File | Change |
|---|---|
| `_bgauss-autodash.scss` (NEW) | Full AutoDash layer: navy sidebar, white 70px topbar, search, large page title + breadcrumb below, 16px cards, KPI tiles, buttons, forms, ng-select, tables, badges, dropdowns, modals, pagination, ApexCharts, dark mode |
| `app.scss` | Imports the new layer last |
| `_variables.scss` | Slate grays, AutoDash palette (primary #6366f1, success #10b981, warning #f59e0b, danger #ef4444, info #0ea5e9), body bg #f1f5f9, radius 10px, softer shadows |
| `_variables-dark.scss` | Dark bg #0b1120 / #111827 |
| `_variables-custom.scss` | `$header-height` 50px → 70px |
| `theme/_default.scss` | Font Inter, base font 13px → 14px, headings 600 |
| `fonts/_fonts.scss` | Adds Google Font Inter |

## Layout settings (recommended)
Sidebar is forced dark and topbar light by CSS, but also set the layout store defaults so the customiser matches:
`LAYOUT: vertical`, `LAYOUT_THEME: default`, `SIDEBAR_COLOR: dark`, `TOPBAR: light`, `SIDEBAR_SIZE: lg`
(Velzon Angular: `src/app/store/layouts/layout-reducers.ts` initial state – verify path in your version.)
Sidebar logo: the dark sidebar shows `.logo-light` – make sure a white BGauss logo is set there.

## New HTML helpers
KPI tile:
```html
<div class="card kpi-card"><div class="card-body d-flex justify-content-between align-items-start">
  <div><p class="kpi-label">Retail (MTD)</p><h3 class="kpi-value">{{ retail | number }}</h3></div>
  <span class="kpi-icon kpi-primary"><i class="ri-motorbike-line"></i></span>
</div></div>
```
Icon tints: `kpi-primary | kpi-blue | kpi-success | kpi-warning | kpi-purple | kpi-danger | kpi-info`
Optional: `.ad-avatar` (initials avatar), `.ad-brand-mark` + `.ad-brand` (text logo), `.kpi-trend.up/.down`.

## Chart colours (ApexCharts)
```ts
colors: ['#5b8def', '#34d399', '#fbbf24', '#a78bfa', '#f472b6', '#2dd4bf'],
chart: { fontFamily: 'Inter, sans-serif', toolbar: { show: false } },
plotOptions: { bar: { borderRadius: 6, columnWidth: '35%' } },
grid: { borderColor: '#f1f5f9' }
```
Velzon charts that use `getChartColorsArray('["--vz-primary", ...]')` pick up the new palette automatically.

## Check after applying
- Pages with hard-coded `margin-top` tied to the old 50px header.
- Screens relying on the old uppercase 15px page title.
- Other data-theme options (corporate, galaxy …) are overridden by this layer by design.
