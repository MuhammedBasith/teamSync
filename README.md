# TeamSync

Multi-organization team management platform built with Next.js and Supabase.

## 📋 Quick Links

- **[SETUP.md](./SETUP.md)** - Complete project structure and setup guide
- **[SIDEBAR_GUIDE.md](./SIDEBAR_GUIDE.md)** - Role-based navigation documentation

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your Supabase credentials:

```bash
cp .env.example .env
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Protected dashboard pages
│   └── api/               # Backend API routes
├── components/            # React components
├── hooks/                 # Custom React hooks
├── lib/                   # Utilities and configurations
│   ├── api/              # Frontend API functions
│   ├── clients/          # API clients (Supabase, etc.)
│   ├── config/           # App configuration
│   ├── server/           # Server-side only code
│   └── utils/            # Shared utilities
├── providers/            # React Context providers
├── types/                # TypeScript type definitions
└── layout/               # Layout components (Header, Sidebar)
```

## 🔑 Key Features

- **Multi-tenancy:** Each organization has isolated data
- **Role-based Access:** Owner, Admin, and Member roles with different permissions
- **Team Management:** Create teams and assign members
- **Activity Logging:** Track all important actions
- **CSV Import:** Bulk user invites via CSV upload
- **Resource Quotas:** Tier-based limits (Free, Pro, Enterprise)
- **Custom Branding:** Organization-specific color palettes

## 👥 User Roles

### Owner
- Full access to all features
- Can manage organization settings
- Can promote/demote admins
- Can delete organization

### Admin
- Can manage teams and members
- Can view activity logs
- Cannot change organization settings

### Member
- Can view dashboard and their teams
- Limited to their own profile
- Cannot manage other users

## 🧪 Testing Role-Based UI

To test different role views, edit `/src/hooks/useRole.ts`:

```typescript
const role: Role = "owner"; // Change to "admin" or "member"
```

See [SIDEBAR_GUIDE.md](./SIDEBAR_GUIDE.md) for detailed testing instructions.

## 📚 Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Data Fetching:** Tanstack Query
- **Authentication:** Supabase Auth (to be configured)
- **Database:** Supabase PostgreSQL (to be configured)
- **File Upload:** react-dropzone

## 🔜 Next Steps

1. Install and configure Supabase SDK
2. Create database schema
3. Implement authentication flow
4. Build API routes with business logic
5. Implement frontend pages with Tanstack Query
6. Setup Row Level Security (RLS) in Supabase

## 📖 Documentation

- **Setup Guide:** [SETUP.md](./SETUP.md)
- **Sidebar Documentation:** [SIDEBAR_GUIDE.md](./SIDEBAR_GUIDE.md)
- **Database Schema:** See PRD documents in project rules

## 🤝 Contributing

This is a private assessment project.

## 📄 License

Private - All rights reserved

---

**Current Status:** ✅ Structure complete, ready for implementation

