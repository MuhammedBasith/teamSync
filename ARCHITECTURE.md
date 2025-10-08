# Architecture Documentation

This document explains the key architectural decisions, security model, and design patterns used in TeamSync.

---

## Architecture Overview

TeamSync follows a server-side first architecture where all database operations happen on the server through API routes. The frontend communicates with the backend exclusively through HTTP requests to Next.js API routes.

```
┌─────────────────────────────────────┐
│         Browser/Client              │
│  - React Components                 │
│  - No direct DB access              │
│  - Makes fetch() calls to /api/*    │
└─────────────────────────────────────┘
                 │
                 │ HTTP Requests
                 ↓
┌─────────────────────────────────────┐
│       Next.js Middleware            │
│  - Route protection                 │
│  - Session validation               │
│  - No database operations           │
└─────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────┐
│       Next.js API Routes            │
│  - Business logic                   │
│  - Permission checks                │
│  - Database operations              │
│  - Activity logging                 │
└─────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────┐
│      Supabase Database              │
│  - PostgreSQL                       │
│  - Authentication                   │
│  - Data storage                     │
└─────────────────────────────────────┘
```

---

## Key Architectural Decisions

### 1. Server-Side Only Database Access

**Decision:** All database operations happen on the server through API routes. No client-side database access.

**Benefits:**
- Complete control over data access patterns
- Better security through centralized permission checks
- Easier to add complex business logic
- Reduced client bundle size
- Better error handling and validation

**Trade-offs:**
- More API routes to maintain
- Cannot use Supabase Realtime features directly from client
- Slightly higher latency compared to direct client access

### 2. API-First Architecture

**Decision:** Frontend components never directly import or use Supabase. All communication happens through API routes.

**Benefits:**
- Clear separation of concerns
- Easier testing and mocking
- Consistent error handling
- Type-safe API contracts
- Better caching strategies with React Query

### 3. Multi-Tenancy Through Organization Isolation

**Decision:** Every table includes an `organization_id` column. All queries filter by the current user's organization.

**Benefits:**
- Complete data isolation between organizations
- Simple to implement and understand
- Easy to add new features with proper isolation
- No risk of cross-organization data leaks
- Every query automatically scoped to user's organization

### 4. Role-Based Access Control in Code

**Decision:** Permission checks happen in API route code, not in database policies (no RLS).

**Benefits:**
- Easier to debug and test
- More flexible for complex permission logic
- Better error messages
- Service role bypasses RLS anyway
- Centralized permission logic in TypeScript

### 5. Activity Logging as First-Class Feature

**Decision:** All major actions automatically log to the activity_log table through a centralized logger.

**Benefits:**
- Provides audit trail for compliance
- Helps with debugging and support
- Users can track what happened in their organization
- Centralized logging ensures consistency
- Easy to filter and export logs

### 6. Tier-Based Resource Quotas

**Decision:** Organizations link to a tier that defines their resource limits. Validation happens before operations.

**Benefits:**
- Easy to implement different pricing tiers
- Prevents abuse and runaway resource usage
- Clear upgrade path for users
- Simple to add new quota types
- Enforced at API level before database operations

---

## Security Model

### Authentication Flow

1. User signs in through Supabase Auth
2. Auth token stored in httpOnly cookie
3. Middleware validates token on protected routes
4. API routes verify user identity and permissions
5. Database operations happen with service role

### Environment Variables

**Server-Side Only (Never Exposed to Browser):**
```bash
SUPABASE_URL=your_project_url
SUPABASE_ANON_KEY=for_session_validation
SUPABASE_SERVICE_ROLE_KEY=for_database_operations
```

**Public Variables:**
```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

We do NOT use `NEXT_PUBLIC_*` prefix for Supabase keys. This keeps them server-side only.

### Two Supabase Clients

**1. Admin Client (Service Role)**
```typescript
// Used in: All API routes
// Purpose: Database operations
// Key: SUPABASE_SERVICE_ROLE_KEY
// Access: Full database access, bypasses RLS

const supabaseAdmin = createSupabaseAdmin();
```

**2. Server Client (Anon Key)**
```typescript
// Used in: Middleware, session validation
// Purpose: Read/write auth cookies, validate JWT
// Key: SUPABASE_ANON_KEY
// Access: Session management only, NO database queries

const supabaseServer = await createSupabaseServer();
```

### Permission Model

**Owner:**
- Full control over organization
- Manage settings and branding
- Invite and remove admins
- Create and delete teams
- View all activity logs

**Admin:**
- Create and manage teams
- Invite and remove members
- View activity logs
- Cannot modify organization settings
- Cannot remove other admins

**Member:**
- View assigned team
- Update own profile
- Limited dashboard access

---

## Security Approach: Why We Don't Use RLS

**We do NOT use Row-Level Security (RLS) policies in this project.**

### Why RLS is Not Needed

Our architecture is designed around **Application-Level Security**, which makes RLS unnecessary:

**1. No Direct Client Access to Database**
- The frontend never talks directly to Supabase
- All database operations happen through our API routes
- There's no way for a user to bypass our permission checks

**2. Service Role Key Bypasses RLS Anyway**
- We use `SUPABASE_SERVICE_ROLE_KEY` for all database operations
- This key has full database access and ignores RLS policies
- Even if we enabled RLS, it wouldn't affect our queries

**3. Permission Checks Happen in Code**
- Every API route validates the user's identity
- We check their role (owner/admin/member) before any operation
- We filter all queries by the user's organization
- This gives us complete control and flexibility

**4. Better Developer Experience**
- Easier to debug - all logic is in one place (API routes)
- More flexible - complex permission logic is simple to write
- Clearer error messages - we control what users see
- No need to learn PostgreSQL RLS syntax

### Our Security Model

Every API request follows this pattern:

**Step 1:** Authenticate the user (is this a valid logged-in user?)

**Step 2:** Fetch their profile (which organization? what role?)

**Step 3:** Check permissions (can they perform this action?)

**Step 4:** Execute query with organization filter (only their org's data)

**Step 5:** Log the action (audit trail for compliance)

All security decisions happen in our TypeScript code, not in database policies.

### When Would We Need RLS?

RLS becomes necessary when:
- Frontend makes direct queries to Supabase (we don't do this)
- Using Supabase Realtime from the client (we don't do this)
- Mobile apps connecting directly to Supabase (not in our scope)
- Using the anon key for database queries (we only use it for auth)

Since none of these apply to our architecture, RLS would be redundant and add unnecessary complexity.

---

## Data Flow Patterns

### 1. Read Operations (Fetching Data)

**Flow:** Component → React Query → API Route → Validate → Check Permission → Query Database → Return Data

- User requests data from the frontend
- API route authenticates and checks permissions
- Query filtered by user's organization
- Data returned to frontend through React Query

### 2. Write Operations (Creating/Updating Data)

**Flow:** Component → API Route → Validate → Check Permission → Check Quota → Update Database → Log Activity → Return Result

- User submits form or action
- API route validates input and permissions
- Quota check ensures limits aren't exceeded
- Database updated with organization filter
- Action logged to activity trail
- Success or error returned to frontend

### 3. Real-Time Updates

We use React Query's built-in features instead of Supabase Realtime:
- Automatic refetching on window focus
- Optimistic updates for instant UI feedback
- Cache invalidation after mutations
- Periodic background refetching

---

## Trade-offs and Future Improvements

### Current Trade-offs

1. **More API Routes**
   - Trade-off: More code to maintain
   - Benefit: Better control and security
   - Future: Could generate API routes from schema

2. **No Real-Time Features**
   - Trade-off: No live updates without refresh
   - Benefit: Simpler architecture, lower cost
   - Future: Could add Server-Sent Events or polling

3. **Email via SMTP**
   - Trade-off: Requires email server configuration
   - Benefit: Works with any provider
   - Future: Could add support for transactional email services

4. **Manual Activity Logging**
   - Trade-off: Must remember to log actions
   - Benefit: Full control over what's logged
   - Future: Could use database triggers or middleware

### Future Improvements

1. **Caching Layer**
   - Add Redis for frequently accessed data
   - Cache quota information
   - Cache organization settings

2. **Real-Time Updates**
   - Implement Server-Sent Events for activity feed
   - Add polling for critical data
   - Consider WebSocket connection for live presence

3. **Audit Log Enhancements**
   - Add before/after snapshots for changes
   - Store more detailed metadata
   - Add ability to revert changes

4. **Search Functionality**
   - Full-text search for members and teams
   - Filter and sort improvements
   - Advanced query builder

5. **Bulk Operations**
   - Bulk team member updates
   - Batch role changes
   - Mass email actions

6. **Analytics Dashboard**
   - Usage trends and insights
   - Activity heatmaps
   - User engagement metrics

---

## AI Usage Note

This project was built with the assistance of AI tools for:
- Code generation and boilerplate
- Documentation writing
- Debugging and problem-solving
- Architecture suggestions

All AI-generated code was reviewed, tested, and modified as needed. Key architectural decisions were made by human developers with AI providing suggestions and alternatives.

---

## Database Schema

For detailed database schema documentation, see the [database diagram](./public/images/db-diagram.png).

### Key Tables

- **tiers** - Pricing plans and resource limits
- **organizations** - Organization data and settings
- **users** - User profiles extending Supabase auth
- **teams** - Team information
- **invites** - Pending user invitations
- **activity_log** - Audit trail of all actions

### Relationships

```
tiers (1) ──< organizations (many)
organizations (1) ──< users (many)
organizations (1) ──< teams (many)
teams (1) ──< users (many)
users (1) ──< activity_log (many)
```

---

## Summary

TeamSync's architecture prioritizes security, maintainability, and developer experience through:
- Server-side first approach
- Clear separation of concerns
- Explicit permission checking
- Comprehensive activity logging
- Tier-based resource management

This architecture provides a solid foundation for scaling the application while maintaining security and data isolation between organizations.

