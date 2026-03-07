# Settings Page Implementation Plan

## Overview
Create a comprehensive "الإعدادات" (Settings) page in the dashboard that manages site-wide configuration. The settings are saved to the backend and consumed by the e-commerce website to dynamically control colors, logos, social links, and homepage sections.

## What the Settings Page Will Contain

### Section 1: Logo
- Upload site logo image (with preview)
- Saved as image file on server

### Section 2: Theme Colors
- **Primary Color** (Light + Dark variants) — replaces `--sz-accent` / `--sz-accent-hover`
- **Secondary Color** (Light + Dark variants) — for secondary buttons, backgrounds, etc.
- Uses native HTML `<input type="color">` color pickers

### Section 3: Social Links & Contact
- Facebook URL
- Instagram URL
- WhatsApp number
- Phone number

### Section 4: Best Selling Products
- Multi-select from existing products list
- Selected products shown as cards with remove button
- These will be displayed on the e-commerce homepage as a "المنتجات الأكثر مبيعاً" section

### Section 5: Best Selling Brands
- Multi-select from existing brands list
- Selected brands shown as cards with remove button
- These will be displayed on the e-commerce homepage as a "العلامات التجارية الأكثر مبيعاً" section

---

## Files to Create/Modify

### Backend (e-commerce server)

1. **NEW: `server/data/site-settings.json`** — Default settings data file
2. **NEW: `server/controllers/settings.controller.js`** — GET/PUT endpoints for settings
3. **NEW: `server/routes/settings.routes.js`** — Route definitions
4. **MODIFY: `server/server.js`** — Register settings routes + serve logo uploads

### Dashboard (checkdashboard)

5. **MODIFY: `src/app/core/config/api.config.ts`** — Add `settingsUrl`
6. **NEW: `src/app/core/models/settings.model.ts`** — ISiteSettings interface
7. **NEW: `src/app/core/services/settings.service.ts`** — HTTP service for settings CRUD
8. **NEW: `src/app/features/dashboard/pages/site-settings/site-settings.component.ts`**
9. **NEW: `src/app/features/dashboard/pages/site-settings/site-settings.component.html`**
10. **NEW: `src/app/features/dashboard/pages/site-settings/site-settings.component.scss`**
11. **MODIFY: `src/app/app.routes.ts`** — Add `/settings` route
12. **MODIFY: `src/app/app.html`** — Add settings link in sidebar

### E-Commerce Website

13. **MODIFY: `e-commerce/src/styles.scss`** — Read colors from settings API on load
14. **NEW: `e-commerce/src/app/core/services/settings.service.ts`** — Service to fetch site settings
15. **MODIFY: `e-commerce/src/app/features/home/home.component.ts`** — Fetch best sellers from settings
16. **MODIFY: `e-commerce/src/app/features/home/home.component.html`** — Add best sellers sections
17. **MODIFY: `e-commerce/src/app/app.ts`** — Apply dynamic theme colors from settings on app init

---

## Implementation Order

1. Backend: Create settings API (data file + controller + routes + register in server.js)
2. Dashboard: Create settings model, service, and API config
3. Dashboard: Create settings page component (UI with all sections)
4. Dashboard: Add route and sidebar link
5. E-Commerce: Create settings service
6. E-Commerce: Apply dynamic colors from settings
7. E-Commerce: Add best sellers sections to homepage
