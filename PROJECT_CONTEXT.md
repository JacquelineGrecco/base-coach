# BaseCoach - Project Context Summary

**Last Updated:** December 2024  
**Project Type:** AI-Powered Youth Sports Evaluation Platform  
**Primary Language:** TypeScript/React

---

## 🛠️ Tech Stack

### Core Framework & Runtime
- **Next.js 15.1.0** - React framework with App Router
- **React 19.2.0** - UI library
- **TypeScript 5.8.2** - Type-safe JavaScript (strict mode enabled)
- **Node.js 18+** - Runtime environment

### Database & Backend
- **Supabase** - Backend-as-a-Service
  - PostgreSQL database
  - Authentication (email/password)
  - Row Level Security (RLS) policies
  - Real-time subscriptions
  - Storage (for future use)

### Styling & UI
- **Tailwind CSS 3.4.17** - Utility-first CSS framework
- **Lucide React 0.554.0** - Icon library
- **Recharts 3.4.1** - Charting library for data visualization

### AI & External Services
- **Google Gemini AI** (`@google/genai 1.30.0`) - AI-powered insights and report generation
  - Gemini 2.5 Flash model
  - Structured output generation
  - Player analysis and drill suggestions

### Additional Libraries
- **react-hot-toast 2.6.0** - Toast notifications
- **react-input-mask 2.0.4** - Input masking for phone numbers
- **jspdf 3.0.4** - PDF generation (for future exports)
- **sharp 0.33.0** - Image optimization

### Development Tools
- **ESLint** - Code linting (Next.js config)
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixing

---

## 📁 Folder Structure

### Root Level
```
base-coach/
├── src/                    # Main source code
├── supabase/              # Database migrations and SQL scripts
├── public/                # Static assets
├── scripts/                # Build and utility scripts
├── docs/                  # Documentation
└── [config files]         # Next.js, TypeScript, Tailwind configs
```

### Source Code Organization (`src/`)

#### **App Router Pages** (`src/app/`)
- `page.tsx` - Main application entry point (client-side routing)
- `layout.tsx` - Root layout with AuthProvider
- `dashboard/page.tsx` - Dashboard route
- `profile/page.tsx` - User profile route
- `pricing/page.tsx` - Pricing/subscription route
- `diagnostics/page.tsx` - Diagnostic tools
- `globals.css` - Global styles

#### **Feature-Based Architecture** (`src/features/`)
The codebase follows a **feature-based organization** where each domain has its own folder:

**`features/auth/`** - Authentication & Authorization
- `components/` - Login, Signup, Password reset, Email verification
- `context/` - AuthContext (React Context for global auth state)
- `services/` - authService, subscriptionService

**`features/match/`** - Match/Session Management
- `components/` - SessionSetup, ActiveSession, MatchClock, SubstitutionManager, etc.
- `hooks/` - Custom hooks (useEvaluationManager, useMatchTimer, useSubstitutions, etc.)
- `services/` - sessionService

**`features/roster/`** - Team & Player Management
- `components/` - Teams, Players, TeamDetail, TeamsContainer
- `services/` - teamService, userService, categoryService

**`features/ai/`** - AI-Powered Features
- `components/` - Reports, DrillLibrary, InsightCard
- `services/` - geminiService, reportService

#### **Shared Components** (`src/components/ui/`)
Reusable UI components:
- Button, Card, Badge, Modal, LoadingSpinner, Skeleton
- Layout, Dashboard, Profile, Pricing
- Trial-related components (TrialModal, TrialExpirationModal, etc.)
- Upgrade prompts and limit modals

#### **Library & Utilities** (`src/lib/`)
- `api/` - API clients (geminiClient, supabaseClient)
- `constants/` - App constants (tierStyles, constants.ts)
- `utils/` - Utility functions (dateTime)
- `supabase.ts` - Supabase client initialization
- `validateEnv.ts` - Environment variable validation
- `sessionRefresh.ts` - Session refresh logic
- `sessionStorage.ts` - Session storage utilities
- `supabaseErrorHandler.ts` - Error handling utilities
- `ai-prompts.ts` - AI prompt templates

#### **Type Definitions** (`src/types/`)
- `database.ts` - Generated Supabase database types
- `index.ts` - Application-level TypeScript types

### Database Migrations (`supabase/migrations/`)
27 migration files tracking database schema evolution:
- Initial schema (users, teams, players, sessions, evaluations)
- RLS policies
- Subscription system
- User deactivation
- Coaching profile fields
- And more...

---

## 🏗️ Core Logic Locations

### **Authentication Flow**
- **Context:** `src/features/auth/context/AuthContext.tsx`
- **Service:** `src/features/auth/services/authService.ts`
- **Components:** `src/features/auth/components/`

### **Session/Evaluation Management**
- **Main Hook:** `src/features/match/hooks/useEvaluationManager.ts`
- **Service:** `src/features/match/services/sessionService.ts`
- **Components:** `src/features/match/components/ActiveSession.tsx`

### **Team & Player Management**
- **Services:** 
  - `src/features/roster/services/teamService.ts`
  - `src/features/roster/services/userService.ts`
  - `src/features/roster/services/categoryService.ts`

### **AI Integration**
- **Client:** `src/lib/api/geminiClient.ts`
- **Services:** 
  - `src/features/ai/services/geminiService.ts`
  - `src/features/ai/services/reportService.ts`
- **Prompts:** `src/lib/ai-prompts.ts`

### **Database Access**
- **Client:** `src/lib/supabase.ts`
- **Types:** `src/types/database.ts` (auto-generated from Supabase schema)

### **Application State Management**
- **Global Auth State:** React Context (`AuthContext`)
- **Local State:** React hooks (useState, useReducer)
- **Session Persistence:** localStorage (via useEvaluationManager)
- **View State:** Centralized in `src/app/page.tsx` (ViewState type)

---

## 📐 Coding Patterns & Style Guide

### **Architecture Patterns**

1. **Feature-Based Organization**
   - Each feature domain has its own folder
   - Features are self-contained (components, hooks, services)
   - Clear separation of concerns

2. **Service Layer Pattern**
   - Business logic in service files (e.g., `teamService.ts`)
   - Services return `{ data, error }` tuples for consistent error handling
   - Services handle all database interactions

3. **Custom Hooks Pattern**
   - Reusable logic extracted into custom hooks
   - Hooks follow `use*` naming convention
   - Examples: `useEvaluationManager`, `useMatchTimer`, `useSubstitutions`

4. **Context API for Global State**
   - Auth state managed via React Context
   - Context provides hooks (e.g., `useAuth()`)

### **Component Patterns**

1. **Client Components**
   - Components using hooks or browser APIs marked with `'use client'`
   - Server components by default (Next.js App Router)

2. **Component Structure**
   - Functional components with TypeScript interfaces
   - Props interfaces defined above component
   - Forward refs when needed (e.g., Button component)

3. **UI Component Library**
   - Reusable components in `src/components/ui/`
   - Consistent styling with Tailwind CSS
   - Variant-based props (e.g., Button variants: primary, secondary, etc.)

### **TypeScript Patterns**

1. **Strict Type Safety**
   - `strict: true` in tsconfig.json
   - Type definitions for all data structures
   - Database types generated from Supabase schema

2. **Type Organization**
   - Application types in `src/types/index.ts`
   - Database types in `src/types/database.ts`
   - Feature-specific types in feature folders

3. **Interface Definitions**
   - Services return typed interfaces
   - Components use explicit prop types
   - Custom hooks return typed objects

### **Error Handling**

1. **Service Error Pattern**
   ```typescript
   return { data: T | null, error: Error | null }
   ```

2. **Try-Catch Blocks**
   - Services wrap operations in try-catch
   - Errors logged to console
   - User-friendly error messages

3. **Error Boundaries**
   - Profile validation errors handled in AuthContext
   - Session errors handled gracefully

### **State Management**

1. **Local State**
   - `useState` for component-level state
   - `useReducer` for complex state (if needed)

2. **Persistence**
   - localStorage for session data (evaluations)
   - Supabase for persistent data (teams, players, sessions)

3. **Auto-Save**
   - Debounced auto-save in useEvaluationManager (2 second delay)
   - Before-unload warnings for unsaved changes

### **Styling Patterns**

1. **Tailwind CSS**
   - Utility-first approach
   - Custom color palette (emerald theme)
   - Responsive design with Tailwind breakpoints

2. **Component Styling**
   - Inline Tailwind classes
   - Variant-based styling (see Button component)
   - Consistent spacing and sizing

### **Code Style Conventions**

1. **Naming**
   - PascalCase for components and types
   - camelCase for functions and variables
   - kebab-case for file names (where applicable)
   - `use*` prefix for custom hooks

2. **File Organization**
   - One component per file
   - Services export object with methods
   - Types exported from index files

3. **Imports**
   - Absolute imports using `@/*` alias (configured in tsconfig.json)
   - Feature imports from feature folders
   - Shared utilities from `@/lib`

4. **Comments**
   - JSDoc comments for complex functions
   - Inline comments for non-obvious logic
   - Portuguese comments for user-facing strings

### **Database Patterns**

1. **Row Level Security (RLS)**
   - All tables have RLS policies
   - User-scoped data access
   - Policies defined in migrations

2. **Soft Deletes**
   - `is_archived` or `is_active` flags instead of hard deletes
   - `archived_at` timestamps for audit trail

3. **Cascading Deletes**
   - Foreign key constraints with ON DELETE CASCADE
   - Ensures data integrity

### **AI Integration Patterns**

1. **Structured Output**
   - Schema-based generation using Gemini
   - Retry logic for failed requests
   - Error fallbacks for unavailable AI

2. **Prompt Management**
   - Centralized prompts in `ai-prompts.ts`
   - Template-based prompt generation
   - Portuguese language prompts

### **Environment & Configuration**

1. **Environment Variables**
   - Validation script (`scripts/validate-env.js`)
   - Required vars checked at build time
   - Client-side vars prefixed with `NEXT_PUBLIC_`

2. **Build Process**
   - Environment validation before build
   - TypeScript compilation
   - Next.js optimization

---

## 🔑 Key Design Decisions

1. **Feature-Based Architecture** - Makes codebase scalable and maintainable
2. **Service Layer** - Separates business logic from UI components
3. **Custom Hooks** - Reusable stateful logic across components
4. **TypeScript Strict Mode** - Catches errors at compile time
5. **Supabase RLS** - Security at the database level
6. **Client-Side Routing** - Single-page app experience with Next.js
7. **LocalStorage Persistence** - Offline-capable session management
8. **Portuguese UI** - Localized for Brazilian market

---

## 📝 Notes for Developers

- **Always use TypeScript** - No `any` types unless absolutely necessary
- **Follow feature organization** - New features should go in `src/features/`
- **Use service layer** - Don't call Supabase directly from components
- **Mark client components** - Use `'use client'` directive when needed
- **Handle errors gracefully** - Always return error objects from services
- **Test with real data** - Use Supabase local development when possible
- **Check migrations** - Review `supabase/migrations/` before schema changes
- **Validate environment** - Run `npm run validate-env` before deploying

---

## 🚀 Getting Started

1. **Install dependencies:** `npm install`
2. **Set up environment:** Copy `.env.example` to `.env.local`
3. **Configure Supabase:** Follow `docs/SUPABASE_SETUP.md`
4. **Run development server:** `npm run dev`
5. **Validate environment:** `npm run validate-env`

---

**This document should be updated as the codebase evolves.**

