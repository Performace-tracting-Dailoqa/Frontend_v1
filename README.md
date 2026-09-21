# MiRai by Dailoqa — Faculty Performance Management System (PMS 2.0)

> An inspiring, high-performance web platform for faculty appraisal, continuous academic dialogue, observation rubrics, and research velocity tracking.

---

## 🚀 Overview

**MiRai by Dailoqa** is an enterprise-grade Faculty Performance Management System built with a sleek Japanese-inspired **Kumo UI-UX architecture**, responsive 3D perspective dynamics, and a dedicated light/dark design system tailored to Dailoqa's brand identity.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router, React Server Components)
- **Library**: [React 19](https://react.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict mode enabled)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) & Vanilla CSS custom tokens
- **Animations & Physics**: [Framer Motion](https://www.framer.com/motion/)
- **Icons & Typography**: Google Fonts (Inter, Outfit, Geist), Google Material Symbols

---

## 📂 Project Structure

```text
Frontend_v1/
├── app/
│   ├── layout.tsx              # Root layout with fonts, metadata, and dark mode base
│   ├── page.tsx                # Landing page with 3D Orbit, Drift Wall & Theme Switcher
│   ├── globals.css             # Design tokens, custom scrollbars, and keyframe animations
│   ├── login/page.tsx          # Faculty authentication portal with interactive credentials
│   ├── dashboard/page.tsx      # Comprehensive faculty performance & rubric management dashboard
│   ├── forgot-password/page.tsx# Password recovery request flow
│   └── reset-password/page.tsx # Credential update confirmation
├── public/
│   ├── mirai_logo.png          # Official MiRai by Dailoqa brand logo (cropped & optimized)
│   ├── dailoqa_logo.png        # Official Dailoqa brand logo (light theme)
│   └── dailoqa-logo-white.png  # Official Dailoqa brand logo (dark theme)
├── src/
│   ├── components/
│   │   ├── kumo/
│   │   │   ├── KumoHeroOrbit.tsx        # 3D interactive tilt podium with orbital quote cards
│   │   │   └── KumoAppraisalRitual.tsx  # Dynamic weight slider mixer & composite score calculator
│   │   ├── animations/
│   │   │   ├── DriftWall.tsx            # React Bits 3D perspective moving quote wall
│   │   │   ├── DailoqaInteractiveBackground.tsx # Mouse-driven particle network & torchlight
│   │   │   ├── DotPattern.tsx           # Subtle geometric canvas grid
│   │   │   ├── SpotlightCard.tsx        # Mouse-following spotlight card
│   │   │   ├── BorderBeam.tsx           # Animated glowing border beam
│   │   │   ├── FloatingParticles.tsx    # Atmospheric ambient floating particles
│   │   │   ├── AuroraBackground.tsx     # Ambient fluid aurora lighting
│   │   │   ├── DecryptedText.tsx        # Matrix-style text reveal
│   │   │   ├── RotatingText.tsx         # Cycling kinetic headline text
│   │   │   ├── TrueFocus.tsx            # Manual or automatic focus highlight
│   │   │   ├── CountUp.tsx              # Animated numerical counter
│   │   │   ├── ShinyText.tsx            # Metallic shimmer text effect
│   │   │   └── SystemStatusPill.tsx     # Live system uptime indicator
│   │   ├── DashboardLayout.tsx          # Wrapper layout for authenticated portal pages
│   │   ├── Header.tsx                   # Top navigation bar for the dashboard
│   │   └── Sidebar.tsx                  # Collapsible navigation drawer
│   └── utils/
│       └── auth.ts                      # Client-side session and mock token management
├── .gitignore                  # Clean developer gitignore (ignores IDE, build, & env files)
├── package.json                # Project dependencies & npm scripts
├── tsconfig.json               # TypeScript path mappings & compiler configuration
└── next.config.ts              # Next.js runtime configuration
```

---

## ⚡ Getting Started

### 1. Prerequisites
- **Node.js**: v18.18.0 or higher
- **npm**: v9.0.0 or higher (or pnpm / yarn)

### 2. Installation
```bash
git clone <repository-url>
cd Frontend_v1
npm install
```

### 3. Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Production Build & Verification
```bash
# Type check without emitting files
npm run build
```

---

## 🔑 Demo Credentials

For quick local testing and evaluation:
- **Email**: `employee@dailoqa.com` (or click the quick-fill chip on the login page)
- **Password**: `password123`
- **Roles supported**: Faculty / Educator, Department Chair, Academic Dean

---

## 🎨 Design System & Theming

- **Electric Indigo**: `#4B2EF5` (Brand primary, interactive buttons, active rings)
- **Radiant Purple**: `#7C3AED` / `#A855F7` (Secondary accents, research metrics)
- **Sky Cyan**: `#0284C7` / `#38BDF8` (Observation & feedback rubrics)
- **Emerald Green**: `#059669` / `#10B981` (High-accreditation scores, success badges)
- **Dark Velvet Theme**: `#080811` canvas, `#090915` cards, `border-white/10`
- **Light Theme**: `#F8FAFC` canvas, `#FFFFFF` cards, `border-slate-200/90`
