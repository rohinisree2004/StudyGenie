# StudyGenie Design System Reference: "Soft Pastels"

This document serves as the **permanent visual design reference** for all current and future StudyGenie modules (Subjects, Gemini AI Study Planner, Notes, Quizzes, Progress, Teacher Monitoring, Notifications, and Admin Management).

---

## 🎨 Official Palette Tokens

| Token Name | Hex Code | Purpose & Semantic Role |
| :--- | :--- | :--- |
| `--pastel-pink` | `#FFD6FF` | Accent highlights, Admin badge, warning/attention chips |
| `--pastel-mauve` | `#E7C6FF` | Accent highlights, Educator badges & tabs, category headers |
| `--pastel-lavender` | `#C8B6FF` | Primary logo accent, feature card tops, focus states |
| `--pastel-periwinkle` | `#B8C0FF` | Interactive card headers, pill badges, subtle active borders |
| `--pastel-sky` | `#BBD0FF` | Student badge, study target cards, progress indicators |

### Canvas & Surface Foundations
- **Page Background (`--bg-page`)**: `#F8F9FC` (Calm, clean off-white with plenty of whitespace)
- **Card / Surface (`--bg-surface`)**: `#FFFFFF` (Crisp white with subtle elevation)
- **Subtle Surface (`--bg-subtle`)**: `#F3F5FA` (For nested card groups, tab rails, demo boxes)
- **Primary Text (`--text-main`)**: `#1E2538` (High-contrast charcoal, WCAG AAA compliant)
- **Secondary Text (`--text-secondary`)**: `#56637E` (Readable slate gray for descriptions)
- **Light Border (`--border-light`)**: `#E7ECF3` (Gentle, airy separation)
- **Brand Interactive (`--brand-primary`)**: `#5A5FDB` (High-contrast interactive primary button with lavender undertone)

---

## 🧩 Reusable Component Standards

### 1. Cards
```html
<!-- Base Card -->
<div class="card">
  <!-- Content -->
</div>

<!-- Pastel Accent Card -->
<div class="card card-pastel-sky">
  <!-- Top 3px subtle border in #BBD0FF -->
</div>
```

### 2. Buttons
```html
<button class="btn btn-primary">Primary Action</button>
<button class="btn btn-secondary">Secondary Action</button>
<button class="btn btn-outline">Outline Action</button>
<button class="btn btn-pastel-sky">Pastel Sky Pill</button>
<button class="btn btn-pastel-lavender">Pastel Lavender Pill</button>
```

### 3. Role & Status Badges
```html
<span class="badge badge-student">Student</span>      <!-- Sky / Periwinkle -->
<span class="badge badge-teacher">Educator</span>     <!-- Lavender / Mauve -->
<span class="badge badge-admin">System Admin</span>   <!-- Soft Pink / Rose -->
<span class="badge badge-active">Active</span>        <!-- Soft Mint / Emerald -->
```

### 4. Form Inputs
```html
<div class="form-group">
  <label class="form-label">Field Title</label>
  <div class="input-wrapper">
    <Icon className="input-icon-left" size={17} />
    <input class="form-input" placeholder="..." />
  </div>
</div>
```

### 5. Tables & Lists (For Future Modules)
- Clean white rows (`#FFFFFF`), light border (`#E7ECF3`), gentle hover state (`#F8F9FC`).
- Rounded container edges (`var(--radius-lg)`).

---

## 📐 Design Philosophy & Rules
1. **Airy Whitespace**: Generous spacing (`padding: 2rem+`, `gap: 1.25rem+`). Avoid crowded dashboards.
2. **Subtle Accents**: Use the pastel colors as accents (borders, badges, icons, top rims, pill active states) rather than saturated full-screen blocks.
3. **Contrast & Readability**: Always keep dark readable text (`#1E2538`) on light pastel backgrounds. Never place light gray or white text over pastels.
4. **Consistency**: All future modules (Gemini AI features, Notes, Quizzes) must import and use `index.css` design system variables.
