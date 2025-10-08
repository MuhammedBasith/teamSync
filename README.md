# TeamSync

A multi-tenant team management platform for modern organizations. TeamSync helps companies manage their teams, members, roles, and organizational activity through a secure and intuitive interface.

**Live Demo:** [https://team-sync-ten.vercel.app](https://team-sync-ten.vercel.app)

---

## What is TeamSync?

TeamSync is a SaaS platform built for organizations that need to manage multiple teams and users within isolated workspaces. Each organization gets its own secure environment with role-based access control, activity tracking, and resource management.

Think of it as your organization's command center where owners and admins can manage teams, invite members, track activities, and monitor resource usage all in one place.

---

## Core Features

### Organization Management
- **Isolated Workspaces** - Each organization operates in its own secure environment with complete data isolation
- **Custom Branding** - Organizations can customize their color palette to match their brand identity
- **Resource Quotas** - Tier-based limits for teams and members (Free, Pro, Enterprise)
- **Organization Settings** - Full control over organization name, colors, and configuration

### Team Management
- **Create and Manage Teams** - Organize your organization into multiple teams
- **Assign Team Managers** - Designate admins to manage specific teams
- **Team Members** - Add, remove, and manage members within each team
- **Team Details** - View comprehensive information about each team and its members

### User Management
- **Role-Based Access Control** - Three distinct roles: Owner, Admin, and Member
- **User Invitations** - Invite users individually via email with role assignment
- **Bulk CSV Import** - Upload multiple user invites at once using CSV files
- **User Profiles** - Each user has a customizable profile with avatar and display name
- **Member Directory** - View and filter all organization members

### Activity Logging
- **Comprehensive Audit Trail** - Track all major actions across the organization
- **Filterable Activity Feed** - Filter by date range and action type
- **Export Capabilities** - Export activity logs as CSV or JSON
- **Timeline View** - Beautiful timeline interface with color-coded activity types
- **Action Types Tracked:**
  - User invitations and acceptances
  - Team creation, updates, and deletions
  - Role changes (promotions and demotions)
  - User removals
  - Organization creation

### Authentication & Security
- **Supabase Authentication** - Secure authentication powered by Supabase Auth
- **Row-Level Security** - Database-level security ensuring complete data isolation
- **Session Management** - Optional "Remember Me" for extended sessions
- **Password Reset** - Secure password recovery via email
- **Protected Routes** - Middleware-protected dashboard routes

### Dashboard
- **Role-Based Views** - Different dashboard experiences for each role
- **Time-Based Greetings** - Personalized welcome messages based on time of day
- **Key Metrics** - View organization statistics at a glance
- **Quota Monitoring** - Visual progress bars showing resource usage
- **Quick Actions** - Role-specific shortcuts to common tasks
- **Recent Activity** - Latest organizational activities for owners and admins

---

## User Roles

### Owner
The organization creator with full control over everything:
- Manage organization settings and branding
- Invite and manage admins
- Create and manage all teams
- View and export activity logs
- Monitor resource quotas
- Cannot belong to multiple organizations

### Admin
Invited by the owner to help manage the organization:
- Create and manage teams
- Invite and manage members
- View activity logs
- Manage team assignments
- Cannot modify organization settings or color palette

### Member
Basic users who can access their assigned teams:
- View their team information
- Access their profile
- Limited dashboard view
- Cannot manage other users or teams

---

## Technology Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **React 19** - Latest React with concurrent features
- **TypeScript** - Full type safety across the codebase
- **Tailwind CSS 4** - Modern utility-first styling
- **TanStack Query** - Powerful data fetching and state management
- **React Dropzone** - File upload handling for CSV imports
- **Lucide React** - Beautiful icon library

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **Supabase** - Backend-as-a-Service for auth and database
- **PostgreSQL** - Relational database via Supabase
- **Zod** - Runtime type validation
- **Nodemailer** - Email sending capabilities

### Development
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TypeScript** - Type checking

---

## Getting Started

### Prerequisites
- Node.js 18+ or Bun
- A Supabase account and project
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/MuhammedBasith/teamSync.git
   cd teamSync
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   bun install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory with the following variables:
   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

   # App Configuration
   NEXT_PUBLIC_APP_URL=http://localhost:3000

   # Email Configuration (optional for development)
   EMAIL_HOST=smtp.your-email-provider.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@example.com
   EMAIL_PASS=your-email-password
   ```

4. **Set up the database**
   
   Run the SQL migrations in your Supabase project to create the required tables. See the `docs/` folder for database schema documentation.

5. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   bun dev
   ```

6. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
teamSync/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                   # Authentication pages
│   │   │   ├── signin/               # Sign in page
│   │   │   ├── signup/               # Sign up page
│   │   │   ├── forgot-password/      # Password recovery
│   │   │   └── reset-password/       # Password reset
│   │   ├── (dashboard)/              # Protected dashboard pages
│   │   │   ├── dashboard/            # Main dashboard
│   │   │   ├── organization/         # Organization management
│   │   │   │   ├── activity/         # Activity logs
│   │   │   │   ├── members/          # Member management
│   │   │   │   ├── admins/           # Admin management
│   │   │   │   └── settings/         # Organization settings
│   │   │   ├── teams/                # Team management
│   │   │   └── profile/              # User profile
│   │   ├── api/                      # API routes
│   │   │   ├── auth/                 # Authentication endpoints
│   │   │   ├── organization/         # Organization endpoints
│   │   │   ├── team/                 # Team endpoints
│   │   │   ├── members/              # Member endpoints
│   │   │   ├── admins/               # Admin endpoints
│   │   │   ├── activity/             # Activity log endpoints
│   │   │   ├── invite/               # Invitation endpoints
│   │   │   ├── quotas/               # Quota endpoints
│   │   │   └── profile/              # Profile endpoints
│   │   ├── layout.tsx                # Root layout
│   │   ├── page.tsx                  # Landing page
│   │   └── globals.css               # Global styles
│   ├── components/                   # React components
│   │   ├── admin/                    # Admin-specific components
│   │   ├── auth/                     # Authentication components
│   │   ├── common/                   # Shared components
│   │   ├── form/                     # Form components
│   │   ├── header/                   # Header components
│   │   ├── landing/                  # Landing page components
│   │   ├── modals/                   # Modal dialogs
│   │   ├── settings/                 # Settings components
│   │   └── tables/                   # Table components
│   ├── context/                      # React contexts
│   │   ├── AuthContext.tsx           # Authentication context
│   │   ├── SidebarContext.tsx        # Sidebar state
│   │   └── ThemeContext.tsx          # Theme context
│   ├── hooks/                        # Custom React hooks
│   │   ├── useAuth.ts                # Authentication hook
│   │   ├── useActivity.ts            # Activity logging hook
│   │   ├── useTeams.ts               # Team management hook
│   │   ├── useMembers.ts             # Member management hook
│   │   ├── useAdmins.ts              # Admin management hook
│   │   ├── useDashboard.ts           # Dashboard data hook
│   │   ├── useQuotas.ts              # Quota management hook
│   │   └── ...                       # Other hooks
│   ├── layout/                       # Layout components
│   │   ├── DefaultLayout.tsx         # Main dashboard layout
│   │   ├── Sidebar.tsx               # Navigation sidebar
│   │   └── ...                       # Other layout components
│   ├── lib/                          # Utility libraries
│   │   ├── api/                      # Frontend API functions
│   │   ├── clients/                  # API clients
│   │   │   └── supabase.ts           # Supabase client
│   │   ├── config/                   # Configuration
│   │   ├── server/                   # Server-side utilities
│   │   │   ├── supabase.ts           # Server Supabase client
│   │   │   ├── authHelpers.ts        # Auth helpers
│   │   │   └── activityLogger.ts     # Activity logging
│   │   └── utils/                    # Shared utilities
│   ├── providers/                    # Context providers
│   ├── types/                        # TypeScript type definitions
│   └── middleware.ts                 # Next.js middleware
├── public/                           # Static assets
│   ├── favicon/                      # Favicon files
│   ├── images/                       # Image assets
│   └── logo/                         # Logo files
├── docs/                             # Documentation
├── package.json                      # Dependencies
├── tsconfig.json                     # TypeScript config
├── tailwind.config.js                # Tailwind config
└── next.config.ts                    # Next.js config
```

---

## Key Concepts

### Multi-Tenancy
Each organization is completely isolated from others. Users can only see and interact with data from their own organization. This is enforced at multiple levels:
- Database Row-Level Security (RLS)
- API-level organization ID checks
- Frontend route protection

### Resource Quotas
Organizations are assigned to tiers that determine their limits:
- **Free Tier**: 5 teams, 25 total members
- **Pro Tier**: Higher limits (placeholder for future implementation)
- **Enterprise Tier**: Custom limits (placeholder for future implementation)

The system validates these limits before allowing new teams or members to be added.

### Activity Logging
Every significant action is automatically logged to the activity_log table:
- Who performed the action (actor)
- What was affected (target)
- When it happened (timestamp)
- Additional details (JSON metadata)

This creates a complete audit trail for compliance and troubleshooting.

### Invite System
Users cannot self-register into existing organizations. All new users must be invited:
- Single email invitations with role assignment
- Bulk CSV uploads for multiple invites
- Unique invite tokens sent via email
- Invites expire and can only be used once

---

## Development

### Running Tests
```bash
npm run test
# or
yarn test
```

### Linting
```bash
npm run lint
# or
yarn lint
```

### Building for Production
```bash
npm run build
# or
yarn build
```

### Starting Production Server
```bash
npm run start
# or
yarn start
```

---

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJhbGci...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (admin access) | `eyJhbGci...` |
| `NEXT_PUBLIC_APP_URL` | Your application URL | `http://localhost:3000` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `EMAIL_HOST` | SMTP server hostname | - |
| `EMAIL_PORT` | SMTP server port | `587` |
| `EMAIL_USER` | SMTP username | - |
| `EMAIL_PASS` | SMTP password | - |

---

## Database Schema

The application uses the following main tables:

- **tiers** - Pricing plans and resource limits
- **organizations** - Organization data and settings
- **users** - User profiles and role assignments
- **teams** - Team information
- **invites** - Pending user invitations
- **activity_log** - Audit trail of all actions

For detailed schema documentation, see `docs/` or the database schema rule in `.cursor/rules/`.

---

## Documentation

Comprehensive documentation is available in the `docs/` directory:

- **SETUP.md** - Detailed setup instructions
- **ACTIVITY_LOG_FEATURE.md** - Activity logging documentation
- **TEAM_MANAGEMENT.md** - Team management guide
- **MEMBERS_FEATURE.md** - Member management documentation
- **BULK_INVITE_FEATURE.md** - CSV import guide
- **ORGANIZATION_SETTINGS_FEATURE.md** - Settings documentation
- **SECURITY_ARCHITECTURE.md** - Security implementation details
- And many more...

---

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms

TeamSync can be deployed to any platform that supports Next.js:
- AWS Amplify
- Netlify
- Railway
- Render
- Self-hosted with Docker

Make sure to:
1. Set all required environment variables
2. Configure your Supabase project with the correct redirect URLs
3. Set up your email provider for invitations

---

## Contributing

This is a private project. Contributions are not accepted at this time.

---

## License

All rights reserved. This is a private project.

---

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Authentication and database powered by [Supabase](https://supabase.com/)
- Icons from [Lucide](https://lucide.dev/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)

---

## Support

For questions or issues, please refer to the documentation in the `docs/` directory.

---

**Built with care for modern team management.**

