# Setup Guide

This guide walks you through setting up TeamSync locally and deploying it to production.

---

## Prerequisites

- Node.js 18+ or Bun
- A Supabase account
- Git

---

## Local Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/MuhammedBasith/teamSync.git
cd teamSync
```

### 2. Install Dependencies

Using npm:
```bash
npm install
```

Using yarn:
```bash
yarn install
```

Using bun:
```bash
bun install
```

### 3. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API to find your project credentials
3. Note down:
   - Project URL
   - Anon key
   - Service role key

### 4. Create Database Tables

Run the following SQL in your Supabase SQL Editor:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tiers table
CREATE TABLE tiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  max_members INTEGER NOT NULL,
  max_teams INTEGER NOT NULL,
  price_per_month NUMERIC DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Organizations table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  tier_id UUID REFERENCES tiers(id),
  owner_id UUID,
  color_palette JSONB DEFAULT '{"primary": "#3b82f6", "accent": "#8b5cf6", "background": "#f8fafc"}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  team_id UUID,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Teams table
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_by UUID REFERENCES users(id),
  manager_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Activity log table
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Invites table
CREATE TABLE invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'member')),
  invited_by UUID REFERENCES users(id),
  accepted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  accepted_at TIMESTAMP
);

-- Insert default tiers
INSERT INTO tiers (name, max_members, max_teams, price_per_month) VALUES
  ('free', 25, 5, 0),
  ('pro', 100, 20, 29),
  ('enterprise', 1000, 100, 99);

-- Create indexes for performance
CREATE INDEX idx_users_org ON users(organization_id);
CREATE INDEX idx_users_team ON users(team_id);
CREATE INDEX idx_teams_org ON teams(organization_id);
CREATE INDEX idx_activity_org ON activity_log(organization_id);
CREATE INDEX idx_activity_created ON activity_log(created_at DESC);
CREATE INDEX idx_invites_org ON invites(organization_id);
CREATE INDEX idx_invites_email ON invites(email);
```

### 5. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Email Configuration (Optional for development)
EMAIL_HOST=smtp.your-email-provider.com
EMAIL_PORT=587
EMAIL_USER=your-email@example.com
EMAIL_PASS=your-email-password
```

**Important:** Never commit your `.env.local` file. Make sure it's in your `.gitignore`.

### 6. Run the Development Server

```bash
npm run dev
# or
yarn dev
# or
bun dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

---

## Environment Variables Explained

### Required Variables

| Variable | Description | Where to Find |
|----------|-------------|---------------|
| `SUPABASE_URL` | Your Supabase project URL | Supabase Dashboard > Settings > API |
| `SUPABASE_ANON_KEY` | Supabase anonymous key (for session management) | Supabase Dashboard > Settings > API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (for admin operations) | Supabase Dashboard > Settings > API |
| `NEXT_PUBLIC_APP_URL` | Your application URL | `http://localhost:3000` for development |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `EMAIL_HOST` | SMTP server hostname | - |
| `EMAIL_PORT` | SMTP server port | `587` |
| `EMAIL_USER` | SMTP username | - |
| `EMAIL_PASS` | SMTP password | - |

**Note:** Email configuration is optional for development. Invitation emails will be logged to the console if email is not configured.

---

## Production Deployment

### Vercel Deployment

1. Push your code to GitHub

2. Go to [vercel.com](https://vercel.com) and sign in

3. Click "New Project" and import your repository

4. Configure environment variables in Vercel:
   - Go to Settings > Environment Variables
   - Add all required variables from your `.env.local`
   - Make sure `NEXT_PUBLIC_APP_URL` points to your production domain

5. Deploy

6. Update Supabase redirect URLs:
   - Go to Supabase Dashboard > Authentication > URL Configuration
   - Add your Vercel domain to "Site URL" and "Redirect URLs"

### Other Platforms

TeamSync can be deployed to any platform that supports Next.js:

- **AWS Amplify:** Follow their Next.js deployment guide
- **Netlify:** Use the Next.js build plugin
- **Railway:** Connect your GitHub repo and deploy
- **Render:** Use their Next.js starter template

For all platforms:
1. Set all required environment variables
2. Update Supabase redirect URLs with your production domain
3. Configure your email provider

---

## Email Setup

### Using Gmail

1. Enable 2-factor authentication on your Google account
2. Generate an app password: [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Use these credentials:
   ```env
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   ```

### Using SendGrid

1. Create a SendGrid account
2. Create an API key
3. Use these credentials:
   ```env
   EMAIL_HOST=smtp.sendgrid.net
   EMAIL_PORT=587
   EMAIL_USER=apikey
   EMAIL_PASS=your-sendgrid-api-key
   ```

### Using Other Providers

TeamSync supports any SMTP provider. Just configure the host, port, username, and password.

---

## Common Issues

### Database Connection Error

**Problem:** Cannot connect to Supabase database

**Solution:**
- Check that your `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are correct
- Make sure you're using the service role key, not the anon key
- Verify that your Supabase project is active

### Authentication Error

**Problem:** Cannot sign in or sign up

**Solution:**
- Check that email authentication is enabled in Supabase
- Go to Supabase Dashboard > Authentication > Providers
- Enable "Email" provider
- Update redirect URLs if deploying to production

### Email Not Sending

**Problem:** Invitation emails are not being sent

**Solution:**
- Check your email configuration in `.env.local`
- Verify SMTP credentials are correct
- For Gmail, make sure you're using an app password
- Check the console logs for error messages

### Missing Tables

**Problem:** Database queries fail with "relation does not exist"

**Solution:**
- Run the database setup SQL script again
- Make sure all tables are created in your Supabase project
- Check that you're connected to the correct Supabase project

---

## Development Tips

### Running Locally

- Use `bun dev` for faster development with Bun
- Enable hot reload in your editor
- Check console logs for errors

### Testing Emails Locally

Without email configuration, invitation emails will be logged to the console. Look for:
```
Invitation email would be sent to: user@example.com
Invite URL: http://localhost:3000/accept-invite/...
```

### Database Inspection

Use Supabase Table Editor to:
- View data in real-time
- Test SQL queries
- Check relationships

---

## Next Steps

After setup:
1. Create your first organization account
2. Explore the dashboard
3. Invite team members
4. Create teams
5. Check the activity log

For feature documentation, see [FEATURES.md](./FEATURES.md).

For architecture details, see [ARCHITECTURE.md](./ARCHITECTURE.md).

