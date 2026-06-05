# NexoLearn MVP V1 - Sprint 1 Implementation

This is the production-ready implementation of Sprint 1 Foundation for NexoLearn, a reciprocal knowledge exchange platform.

## Technology Stack

- **Frontend**: Next.js 16, TypeScript, React 19, Tailwind CSS, Shadcn/UI
- **Backend**: NestJS, TypeScript, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: Supabase Auth
- **Deployment**: Vercel (frontend), Node.js/Vercel Functions (backend)
- **Monorepo**: pnpm workspaces + Turbo

## Project Structure

```
nexolearn/
├── apps/
│   ├── api/              # NestJS backend
│   │   ├── src/
│   │   │   ├── common/   # Shared auth, filters, interceptors
│   │   │   ├── modules/  # Feature modules (auth, profile)
│   │   │   └── main.ts
│   │   ├── prisma/       # Database schema and migrations
│   │   └── package.json
│   └── web/              # Next.js frontend
│       ├── app/          # Next.js app router pages
│       ├── components/   # Reusable UI components (future)
│       ├── lib/          # Hooks, context, utilities
│       └── package.json
├── package.json          # Root monorepo config
├── turbo.json            # Turborepo configuration
└── pnpm-workspace.yaml   # pnpm workspace config
```

## Setup Instructions

### Prerequisites

- Node.js 20+
- pnpm 9+
- PostgreSQL database (local or Supabase)
- Supabase project (for Auth)

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment Variables

**Backend (`apps/api/.env.local`)**:
```
NODE_ENV=development
LOG_LEVEL=debug
PORT=3001
DATABASE_URL=postgresql://user:password@localhost:5432/nexolearn
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_JWT_SECRET=your-jwt-secret
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
API_URL=http://localhost:3001
```

**Frontend (`apps/web/.env.local`)**:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### 3. Setup Database

```bash
# Generate Prisma client
pnpm run db:migrate

# (Optional) Seed test data
pnpm run db:seed
```

### 4. Start Development

```bash
# Start both frontend and backend
pnpm run dev

# Or run individually:
cd apps/api && pnpm run start:dev
cd apps/web && pnpm run dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- API Health: http://localhost:3001/health

## Sprint 1 Features

✅ **Foundation**
- Monorepo structure with pnpm workspaces
- TypeScript strict mode everywhere
- NestJS backend with modular architecture
- Next.js frontend with app router
- Supabase Auth integration
- Prisma database ORM

✅ **Authentication**
- Sign up with email/password
- Sign in with email/password
- Logout
- JWT token refresh
- Protected routes
- Auth context and hooks

✅ **User Profile**
- Create profile on signup
- View own profile
- Update profile (name, bio, location, timezone)
- Browse profiles (paginated, searchable)
- Profile discovery

✅ **Database Schema** (Sprint 1 foundation tables)
- `profiles` - User profiles
- `user_skills` - User skill declarations
- `skills` - Skill catalog
- `learning_goals` - User learning objectives
- `matches` - Match records
- `exchange_sessions` - Session records
- `session_participants` - Participants in sessions
- `session_reviews` - Session feedback
- `reputation_scores` - User reputation
- `contribution_balances` - Contribution points
- `nexos_wallets` - NEXOS currency
- `audit_logs` - Audit trail

## API Endpoints (Sprint 1)

### Authentication
- `POST /api/v1/auth/signup` - Register new user
- `POST /api/v1/auth/login` - Login with email/password
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout (auth required)
- `GET /api/v1/auth/me` - Get current user (auth required)

### Profiles
- `GET /api/v1/profiles/me` - Get own profile (auth required)
- `PATCH /api/v1/profiles/me` - Update profile (auth required)
- `GET /api/v1/profiles` - List profiles (paginated, searchable)
- `GET /api/v1/profiles/:id` - Get profile by ID

### Health
- `GET /health` - API health check

## Frontend Pages (Sprint 1)

- `/` - Landing/redirect to dashboard or login
- `/auth/login` - Login page
- `/auth/signup` - Signup page
- `/dashboard` - Main dashboard with profile overview
- `/onboarding/profile-setup` - Complete profile information
- `/onboarding/skills` - Placeholder (Sprint 2)
- `/onboarding/goals` - Placeholder (Sprint 2)
- `/matches` - Placeholder (Sprint 3)
- `/sessions` - Placeholder (Sprint 4)

## Development Commands

```bash
# Build all packages
pnpm run build

# Run tests
pnpm run test
pnpm run test:watch
pnpm run test:cov

# Lint and format
pnpm run lint
pnpm run lint:fix
pnpm run format

# Type checking
pnpm run type-check

# Database operations
pnpm run db:migrate          # Create migration and apply
pnpm run db:migrate:prod     # Apply migrations (production)
pnpm run db:reset            # Reset database (dev only)
pnpm run db:seed             # Seed test data
pnpm run db:studio           # Open Prisma Studio

# Clean builds
pnpm run clean
```

## Testing

### Backend Unit Tests
```bash
cd apps/api
pnpm run test
```

### Backend Integration Tests
```bash
cd apps/api
pnpm run test:e2e
```

### Frontend Component Tests
```bash
cd apps/web
pnpm run test
```

## Architecture Overview

### Backend (NestJS)

**Layered Architecture**:
1. **Controllers** - HTTP endpoint handling, request/response
2. **Services** - Business logic and domain rules
3. **Repositories** - Data access and persistence
4. **Guards/Filters** - Authentication, validation, error handling

**Modules**:
- `AuthModule` - Authentication logic and JWT handling
- `ProfileModule` - User profile management
- `PrismaModule` - Database connection

**Common**:
- `SupabaseAuthGuard` - JWT validation from Supabase
- `ResponseInterceptor` - Standardized API responses
- `HttpExceptionFilter` - Global error handling
- `LoggerService` - Winston-based logging

### Frontend (Next.js)

**Context Providers**:
- `AuthContext` - Manages auth state, session, Supabase client
- `NotificationContext` - Toast notifications

**Hooks**:
- `useAuth()` - Access auth state and methods
- `useNotification()` - Trigger notifications

**API Client**:
- `fetchAPI()` - Base fetch with auth headers
- Module-specific clients: `profiles.ts`, etc.

**Pages**:
- Server-side layout and providers
- Client-side page components with auth guards

## Security Considerations (Sprint 1)

✅ Implemented:
- Supabase JWT validation on all protected endpoints
- Password hashing via Supabase
- CORS configuration
- Request validation with class-validator
- TypeScript strict mode
- Auth guard on protected routes
- Secure token storage (Supabase session storage)

TODO (Future Sprints):
- Rate limiting on auth endpoints
- CSRF protection
- Content Security Policy headers
- Database encryption at rest
- Audit logging for sensitive operations
- RLS policy implementation on Supabase

## Known Limitations (Sprint 1)

- Skills and Learning Goals tables exist but features not built (Sprint 2)
- Matching algorithm not implemented (Sprint 3)
- Session workflows not implemented (Sprint 4)
- Reviews, reputation, contribution, wallet not implemented (Sprints 5-6)
- Admin panels not implemented (Sprint 6)
- No real-time updates (future consideration)
- No file upload/avatar support yet

## Deployment

### Frontend (Vercel)

```bash
# Automatic deployment on git push to main
# Or manual:
pnpm run build
vercel deploy
```

### Backend (Vercel Functions or Node.js)

```bash
# Build
cd apps/api
pnpm run build

# Deploy to Vercel Functions (recommended for MVP)
# Or deploy as standalone Node service

# For production:
NODE_ENV=production pnpm run start:prod
```

## Troubleshooting

### Database connection fails
- Verify `DATABASE_URL` in `.env.local`
- Check PostgreSQL is running
- Test connection: `prisma db push --skip-generate`

### Auth not working
- Verify Supabase credentials in `.env.local`
- Check JWT secret matches Supabase settings
- Test token validation in Postman

### CORS errors
- Add frontend origin to `CORS_ORIGINS` in backend `.env.local`
- Clear browser cache

### TypeScript errors
- Run `pnpm run type-check` to verify
- Check `tsconfig.json` in each package

## Next Steps (Sprint 2+)

See [BUILD_PLAN_V1.md](../../docs/BUILD_PLAN_V1.md) for complete implementation roadmap.

## Contributing

Follow the established patterns:
- Services contain business logic
- Repositories handle data access
- Controllers only validate and delegate
- DTOs for request/response contracts
- Comprehensive error handling

## License

Proprietary - NexoLearn
