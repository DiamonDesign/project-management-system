# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Development server**: `pnpm dev` or `npm run dev` - Start Vite development server
- **Build production**: `pnpm build` or `npm run build` - Build for production
- **Build development**: `pnpm build:dev` or `npm run build:dev` - Build in development mode
- **Lint code**: `pnpm lint` or `npm run lint` - Run ESLint on all files
- **Preview build**: `pnpm preview` or `npm run preview` - Preview production build locally

The project uses **pnpm** as the preferred package manager (pnpm-lock.yaml present).

## Project Architecture

### Tech Stack
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 6
- **Router**: React Router DOM v6
- **UI Library**: shadcn/ui with Radix UI components
- **Styling**: Tailwind CSS
- **Backend**: Supabase (authentication, database, edge functions)
- **State Management**: React Context API + TanStack Query
- **Forms**: React Hook Form with Zod validation
- **Rich Text**: React Quill
- **Drag & Drop**: @hello-pangea/dnd
- **Charts**: Recharts

### Directory Structure
```
src/
├── components/          # Application components
│   ├── ui/             # shadcn/ui components (DO NOT EDIT)
│   └── *.tsx           # Custom application components
├── pages/              # Page components (route handlers)
├── context/            # React Context providers
├── hooks/              # Custom React hooks
├── integrations/       # External service integrations
├── lib/                # Utility libraries
├── utils/              # Utility functions
└── App.tsx             # Main app with routing (KEEP ROUTES HERE)
```

### Application Architecture

This is a **project management application** with client portal functionality:

**Core Entities**:
- Projects: Main work containers with tasks, notes, and client assignments
- Clients: External stakeholders with portal access
- Tasks: Work items within projects with drag-and-drop Kanban boards
- Notes: Rich text documentation with enhanced formatting (titles, details, priority, due dates)

**Authentication & Authorization**:
- Supabase Auth handles user sessions
- SessionContext manages auth state and user profiles
- Client portal users have separate authentication flow via invite system

**Key Contexts**:
- `SessionContext`: User authentication and profile management
- `ProjectContext`: Project state and operations
- `ClientContext`: Client management and portal access

**Database Integration**:
- Supabase client configured in `src/integrations/supabase/client.ts`
- Environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- Edge function for client invitations in `supabase/functions/invite-client/`

### Routing Structure
All routes are defined in `src/App.tsx`. Two main route groups:

**Public Routes**:
- `/` - Index/landing page
- `/login` - Authentication
- `/client-portal/invite` - Client invitation handling
- `/client-portal/dashboard` - Client portal dashboard

**Protected Routes** (wrapped in Layout):
- `/dashboard` - Main dashboard
- `/projects` - Project listing and management
- `/projects/:id` - Project detail with tasks and notes
- `/clients` - Client management
- `/clients/:id` - Client detail
- `/tasks` - Task management
- `/profile` - User profile

### UI Components

**shadcn/ui Integration**:
- Complete shadcn/ui component library installed
- Components located in `src/components/ui/` - **DO NOT EDIT THESE**
- Use these components as building blocks for new features
- All Radix UI dependencies already installed

**Custom Components**:
- Component patterns follow shadcn/ui conventions
- Tailwind CSS for all styling
- Lucide React for icons

### Important Development Notes

**File Organization**:
- Main page is `src/pages/Index.tsx`
- Always update main page or routing when adding new components
- Put pages in `src/pages/`, components in `src/components/`
- Keep all route definitions in `src/App.tsx`

**UI Development**:
- ALWAYS use shadcn/ui components first
- Extensive Tailwind CSS usage expected
- Don't edit files in `src/components/ui/`
- Create new components if customization needed

**State Management**:
- React Context for global state (auth, projects, clients)
- TanStack Query for server state management
- Local component state with useState/useReducer

**Forms and Validation**:
- React Hook Form for form management
- Zod for schema validation
- Toast notifications via Sonner

**Supabase Integration**:
- Database operations through Supabase client
- Real-time subscriptions available
- Edge functions for complex server operations
- Row Level Security (RLS) policies enforced

## Button Icon Alignment Standards

**Problem**: Icons in buttons can become misaligned, appearing above text instead of centered alongside it.

**Root Cause**: Using flexbox with `gap` spacing and nested div containers with margin-based positioning (`mr-2`, `ml-auto`, etc.) creates inconsistent alignment.

**Solution**: Use absolute positioning pattern for consistent icon-text alignment.

### Standard Button Patterns

**Left-side icons:**
```tsx
<Button className="relative pl-9 pr-3">
  <IconComponent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 flex-shrink-0 pointer-events-none" />
  <span>Button Text</span>
</Button>
```

**Right-side icons:**
```tsx
<Button className="relative pl-3 pr-12">
  <span>Button Text</span>
  <IconComponent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 flex-shrink-0 pointer-events-none" />
</Button>
```

**Key Requirements:**
- Always use `relative` positioning on button container
- Use `absolute` positioning for icons with `left-3`/`right-3` and `top-1/2 -translate-y-1/2`
- Add `flex-shrink-0 pointer-events-none` to all icons
- Wrap text content in `<span>` tags
- Use `pl-9 pr-3` for left icons, `pl-3 pr-12` for right icons
- Icon size should be `h-4 w-4` (or `w-5 h-5` for larger buttons)

**Anti-patterns to avoid:**
- ❌ Flexbox with `gap-3` and nested divs
- ❌ Margin-based spacing (`mr-2`, `ml-auto`, `ml-2`)
- ❌ Icons without absolute positioning
- ❌ Missing `flex-shrink-0 pointer-events-none` on icons

**Detection command:**
```bash
# Find buttons with potential alignment issues
grep -r "mr-2\|ml-2\|ml-auto\|gap-.*>" src/components/ src/pages/
```