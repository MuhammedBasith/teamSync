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

**Reasoning:**
- Complete control over data access patterns
- Better security through centralized permission checks
- Easier to add complex business logic
- Reduced client bundle size
- Better error handling and validation

**Trade-offs:**
- More API routes to maintain
- Cannot use Supabase Realtime features directly from client
- Slightly higher latency compared to direct client access

**Implementation:**
```typescript
// API Route (server-side)
export async function GET(request: NextRequest) {
  const supabase = createSupabaseAdmin();
  
  // Get authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  
  // Check permissions
  if (!hasPermission(user, 'read:teams')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  
  // Fetch data
  const teams = await supabase.from('teams').select();
  return NextResponse.json(teams);
}
```

### 2. API-First Architecture

**Decision:** Frontend components never directly import or use Supabase. All communication happens through API routes.

**Reasoning:**
- Clear separation of concerns
- Easier testing and mocking
- Consistent error handling
- Type-safe API contracts
- Better caching strategies

**Implementation:**
```typescript
// Frontend Component
const { data: teams } = useQuery({
  queryKey: ['teams'],
  queryFn: async () => {
    const response = await fetch('/api/teams');
    return response.json();
  }
});
```

### 3. Multi-Tenancy Through Organization Isolation

**Decision:** Every table includes an `organization_id` column. All queries filter by the current user's organization.

**Reasoning:**
- Complete data isolation between organizations
- Simple to implement and understand
- Easy to add new features with proper isolation
- No risk of cross-organization data leaks

**Implementation:**
```typescript
// Every query includes organization filter
const teams = await supabase
  .from('teams')
  .select('*')
  .eq('organization_id', user.organization_id);
```

### 4. Role-Based Access Control in Code

**Decision:** Permission checks happen in API route code, not in database policies.

**Reasoning:**
- Easier to debug and test
- More flexible for complex permission logic
- Better error messages
- Service role bypasses RLS anyway
- Centralized permission logic

**Implementation:**
```typescript
export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser();
  
  // Permission check in code
  if (user.role !== 'owner' && user.role !== 'admin') {
    return NextResponse.json(
      { error: 'Only owners and admins can delete teams' },
      { status: 403 }
    );
  }
  
  // Proceed with deletion
}
```

### 5. Activity Logging as First-Class Feature

**Decision:** All major actions automatically log to the activity_log table through a centralized logger.

**Reasoning:**
- Provides audit trail for compliance
- Helps with debugging and support
- Users can track what happened in their organization
- Centralized logging ensures consistency

**Implementation:**
```typescript
// Centralized activity logger
await logActivity({
  actor_id: user.id,
  organization_id: user.organization_id,
  action_type: 'team_created',
  target_type: 'team',
  target_id: team.id,
  details: { team_name: team.name }
});
```

### 6. Tier-Based Resource Quotas

**Decision:** Organizations link to a tier that defines their resource limits. Validation happens before operations.

**Reasoning:**
- Easy to implement different pricing tiers
- Prevents abuse and runaway resource usage
- Clear upgrade path for users
- Simple to add new quota types

**Implementation:**
```typescript
// Check quota before creating team
const quota = await getQuotaInfo(organization_id);
if (quota.teams.current >= quota.teams.max) {
  return NextResponse.json(
    { error: 'Team limit reached' },
    { status: 400 }
  );
}
```

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

## Row-Level Security (RLS) Overview

While our architecture primarily relies on API-level permission checks, we implement basic RLS policies as a defense-in-depth measure.

### Why RLS is Secondary in Our Architecture

Our service role bypasses RLS policies, and all database operations go through API routes that check permissions in code. However, RLS provides an additional security layer if:
- A service role key is compromised
- A bug allows unauthorized queries
- Direct database access is needed for maintenance

### Basic RLS Policies (Defense in Depth)

Even though we don't rely on them, here are recommended RLS policies:

```sql
-- Users can only see their own organization's data
CREATE POLICY "org_isolation_users"
ON users FOR SELECT
USING (organization_id = (
  SELECT organization_id FROM users WHERE id = auth.uid()
));

-- Teams are organization-scoped
CREATE POLICY "org_isolation_teams"
ON teams FOR SELECT
USING (organization_id = (
  SELECT organization_id FROM users WHERE id = auth.uid()
));

-- Activity logs are organization-scoped
CREATE POLICY "org_isolation_activity"
ON activity_log FOR SELECT
USING (organization_id = (
  SELECT organization_id FROM users WHERE id = auth.uid()
));
```

**Important:** These policies won't affect our API routes since we use the service role. They exist as a safety net.

### Our Primary Security Approach

Instead of relying on RLS, we:
1. Check user identity in API routes
2. Verify user's organization
3. Check role permissions in code
4. Filter all queries by organization_id
5. Log all sensitive actions

```typescript
// Example permission check in API route
export async function GET(request: NextRequest) {
  const supabaseAdmin = createSupabaseAdmin();
  
  // 1. Get authenticated user
  const { data: { user } } = await supabaseServer.auth.getUser();
  if (!user) return unauthorized();
  
  // 2. Get user profile with org and role
  const profile = await supabaseAdmin
    .from('users')
    .select('organization_id, role')
    .eq('id', user.id)
    .single();
  
  // 3. Check role permission
  if (profile.role !== 'owner' && profile.role !== 'admin') {
    return forbidden();
  }
  
  // 4. Query with org filter
  const data = await supabaseAdmin
    .from('teams')
    .select('*')
    .eq('organization_id', profile.organization_id);
  
  return NextResponse.json(data);
}
```

---

## Data Flow Patterns

### 1. Query Pattern (Read Operations)

```
Component → React Query → API Route → Validate User → Check Permission → Query DB → Return Data
```

Example:
```typescript
// Component
const { data } = useQuery({
  queryKey: ['teams'],
  queryFn: () => fetch('/api/teams').then(r => r.json())
});

// API Route
export async function GET(request: NextRequest) {
  const user = await validateUser(request);
  if (!user) return unauthorized();
  
  const teams = await db.teams
    .where('organization_id', user.organization_id)
    .fetch();
  
  return NextResponse.json(teams);
}
```

### 2. Mutation Pattern (Write Operations)

```
Component → React Query Mutation → API Route → Validate → Check Permission → Update DB → Log Activity → Return Result
```

Example:
```typescript
// Component
const mutation = useMutation({
  mutationFn: (data) => fetch('/api/teams', {
    method: 'POST',
    body: JSON.stringify(data)
  })
});

// API Route
export async function POST(request: NextRequest) {
  const user = await validateUser(request);
  const data = await request.json();
  
  // Check quota
  await checkQuota(user.organization_id, 'teams');
  
  // Create team
  const team = await db.teams.create({
    ...data,
    organization_id: user.organization_id
  });
  
  // Log activity
  await logActivity({
    actor_id: user.id,
    action_type: 'team_created',
    target_id: team.id
  });
  
  return NextResponse.json(team);
}
```

### 3. Real-Time Updates Pattern

Since we don't use Supabase Realtime, we rely on:
- React Query's automatic refetching
- Optimistic updates
- Manual invalidation after mutations

```typescript
const queryClient = useQueryClient();

const mutation = useMutation({
  mutationFn: createTeam,
  onSuccess: () => {
    // Invalidate and refetch
    queryClient.invalidateQueries({ queryKey: ['teams'] });
  }
});
```

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

