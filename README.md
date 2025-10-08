# TeamSync

A multi-tenant team management platform for modern organizations. TeamSync helps companies manage their teams, members, roles, and organizational activity through a secure and intuitive interface.

**Live Demo:** [https://teamsync.basith.me/](https://teamsync.basith.me/)

---

## What is TeamSync?

TeamSync is a SaaS platform built for organizations that need to manage multiple teams and users within isolated workspaces. Each organization gets its own secure environment with role-based access control, activity tracking, and resource management.

Think of it as your organization's command center where owners and admins can manage teams, invite members, track activities, and monitor resource usage all in one place.

---

## Key Features

- **Organization Management** - Isolated workspaces with custom branding and resource quotas
- **Team Management** - Create teams, assign managers, and organize members
- **User Management** - Role-based access with owner, admin, and member roles
- **Activity Logging** - Comprehensive audit trail with export capabilities
- **Bulk User Import** - CSV upload for inviting multiple users
- **Authentication & Security** - Supabase-powered auth with secure session management

---

## Technology Stack

### Frontend
- Next.js 15 with App Router
- React 19
- TypeScript
- Tailwind CSS 4
- TanStack Query

### Backend
- Next.js API Routes
- Supabase (Auth + PostgreSQL)
- Zod for validation
- Nodemailer for emails

---

## Documentation

- **[SETUP.md](./SETUP.md)** - Installation and configuration guide
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Architecture decisions and RLS policies
- **[FEATURES.md](./FEATURES.md)** - Detailed feature documentation
- **[SCREENSHOTS.md](./SCREENSHOTS.md)** - Visual feature showcase
- **[Database Schema](./public/images/db-diagram.png)** - Database structure diagram

---

## Quick Start

1. Clone the repository
   ```bash
   git clone https://github.com/MuhammedBasith/teamSync.git
   cd teamSync
   ```

2. Install dependencies
   ```bash
   npm install
   # or
   bun install
   ```

3. Set up environment variables (see [SETUP.md](./SETUP.md))

4. Run the development server
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

For detailed setup instructions, see [SETUP.md](./SETUP.md).

---

## User Roles

### Owner
The organization creator with full control. Can manage settings, invite admins, create teams, and view all activity logs.

### Admin
Invited by the owner to help manage the organization. Can create teams, invite members, and view activity logs. Cannot modify organization settings.

### Member
Basic users who can access their assigned teams and profile.

---

## Project Structure

```
teamSync/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Authentication pages
│   │   ├── (dashboard)/        # Protected dashboard pages
│   │   └── api/                # API routes
│   ├── components/             # React components
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Utility libraries
│   ├── providers/              # Context providers
│   ├── types/                  # TypeScript definitions
│   └── middleware.ts           # Route protection
├── public/                     # Static assets
└── package.json                # Dependencies
```

---

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables
4. Deploy

The application can also be deployed to other platforms that support Next.js like AWS Amplify, Netlify, Railway, or Render.

---

## License

All rights reserved. This is a private project.

---

## Acknowledgments

Built with Next.js, Supabase, Tailwind CSS, and Lucide icons.

---

**Built for modern team management.**
