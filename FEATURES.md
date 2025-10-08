# Features Documentation

This document provides a comprehensive overview of all features implemented in TeamSync.

---

## Table of Contents

1. [Organization Management](#organization-management)
2. [User Management](#user-management)
3. [Team Management](#team-management)
4. [Activity Logging](#activity-logging)
5. [Authentication & Security](#authentication--security)
6. [Dashboard](#dashboard)
7. [Profile Management](#profile-management)

---

## Organization Management

### Organization Creation

When a user signs up, they automatically create a new organization and become the owner.

**Features:**
- Automatic organization creation during signup
- Owner is assigned automatically
- Default free tier assignment
- Custom color palette selection

**Implementation:**
- Organization name is provided during signup
- User is linked to organization with owner role
- Free tier limits applied (5 teams, 25 members)

### Organization Settings

Owners can customize their organization settings.

**Features:**
- Edit organization name
- Customize color palette (primary, accent, background colors)
- View current tier and limits
- Monitor resource usage (teams and members)

**Restrictions:**
- Only owners can access settings
- Color changes persist across sessions
- Tier cannot be changed (prepared for future upgrade feature)

**Future Improvements:**
- Color theme preview before saving
- Dynamic theme application across all pages
- Organization logo upload
- Custom domain support

---

## User Management

### User Roles

TeamSync implements a three-tier role system:

**Owner:**
- Full control over organization
- Manage organization settings
- Invite and remove admins
- Create and manage all teams
- View all activity logs
- Cannot be demoted or removed

**Admin:**
- Create and manage teams
- Invite and remove members
- View activity logs
- Cannot modify organization settings
- Cannot remove other admins
- Can be demoted by owner (with restrictions)

**Member:**
- View assigned team
- Update own profile
- Limited dashboard access
- Cannot manage other users

### Inviting Users

#### Single User Invitation

Owners and admins can invite users via email.

**Owner Capabilities:**
- Invite admins
- Invite members
- Assign role during invitation
- Optionally assign team during invitation

**Admin Capabilities:**
- Invite members only
- Must assign team during invitation
- Cannot invite admins

**Process:**
1. Enter email and select role
2. Optionally select team (required for admins)
3. System checks quota limits
4. Invitation email sent with unique token
5. Invite logged to activity log

**Validations:**
- Email format validation
- Duplicate email check (cannot invite existing user)
- Quota validation (must have available slots)
- Role restrictions (admins cannot invite admins)

#### Bulk User Invitation

Owners and admins can upload CSV files to invite multiple users.

**CSV Format:**
```csv
email,role
john@example.com,member
jane@example.com,admin
```

**Features:**
- Batch processing of invitations
- Skip invalid or duplicate emails
- Error report for failed invitations
- All successful invites logged to activity log
- Email sent to each invited user

**Validations:**
- CSV format validation
- Email format for each row
- Role must be "admin" or "member"
- Quota check for total invites
- Duplicate detection across CSV and existing users

**Error Handling:**
- Invalid rows skipped with detailed error message
- Partial success supported (some invites succeed, some fail)
- Summary report shown after processing

### Managing Invitations

#### Pending Invitations

View all pending invitations for the organization.

**Features:**
- List all pending invites with status
- Filter by role
- Revoke pending invitations
- Resend invitation email (UI ready, backend in progress)

**Display Information:**
- Email address
- Role
- Invited by
- Date invited
- Status (pending/accepted)

#### Revoking Invitations

Cancel pending invitations before they are accepted.

**Process:**
1. Select pending invitation
2. Confirm revocation
3. Invitation deleted from system
4. Action logged to activity log

**Use Cases:**
- Invitation sent to wrong email
- User no longer needed
- Role changed, need to resend with different role

**Note:** Same email can be re-invited after revocation.

### Managing Existing Users

#### View Members

Owners see all organization members across all teams.

Admins see members in their managed teams.

**Features:**
- Searchable member list
- Filter by team
- Filter by role
- View member details (name, email, role, team)

#### View Admins

Owners can see all admins in the organization.

**Display Information:**
- Admin name and email
- Teams managed by admin
- Date added
- Invited by

**Actions:**
- Remove admin (with restrictions)
- Demote admin to member (with restrictions)

#### Role Changes

##### Promote Member to Admin

Owners can promote members to admin role.

**Process:**
1. Select member from member list
2. Click "Change Role" and select "Admin"
3. System sends role change notification email
4. User's role updated to admin
5. Action logged to activity log

**Email Notification:**
```
Subject: Your role has been changed in [Organization Name]
Body: You have been promoted to Admin role...
```

##### Demote Admin to Member

Owners can demote admins to member role.

**Restrictions:**
- Cannot demote admin managing active teams
- Must reassign teams to another admin first
- Error shown with list of teams blocking demotion

**Process:**
1. Select admin with no managed teams
2. Click "Change Role" and select "Member"
3. System sends role change notification email
4. User's role updated to member
5. Action logged to activity log

**Error Example:**
```
Cannot demote admin to member. They are currently managing 1 team(s): Engineering.
Please reassign these teams to another admin first.
```

#### Remove Users

##### Remove Admin

Owners can remove admins from the organization.

**Restrictions:**
- Cannot remove admin managing active teams
- Must reassign teams first

**Process:**
1. Confirm removal with modal dialog
2. User removed from organization
3. Email sent notifying admin of removal
4. All user data archived
5. Action logged to activity log

**Email Notification:**
```
Subject: Your admin access has been removed from [Organization Name]
Body: Your admin privileges have been revoked...
```

**Note:** After removal, the same email can be re-invited.

##### Remove Member

Owners and admins can remove members.

**Restrictions for Admins:**
- Can only remove members from their managed teams

**Process:**
1. Confirm removal
2. User removed from team and organization
3. Member notified via email
4. Action logged to activity log

#### Move Members Between Teams

Owners and admins managing multiple teams can reassign members.

**Features:**
- Select member from current team
- Choose new team from dropdown
- Transfer happens immediately
- No email notification for team changes (future feature)
- Action logged to activity log

**Use Cases:**
- Reorganizing team structure
- Member switching departments
- Balancing team sizes

---

## Team Management

### Create Team

Owners and admins can create new teams.

**Required Information:**
- Team name
- Team manager (must be an admin)

**Validations:**
- Unique team name within organization
- Quota check (max teams limit)
- Manager must have admin role
- Manager can manage multiple teams

**Process:**
1. Enter team name
2. Select admin as manager
3. System checks quota
4. Team created and linked to organization
5. Manager assigned to team
6. Action logged to activity log

**Quota Enforcement:**
- Free tier: 5 teams maximum
- Pro tier: 20 teams (placeholder)
- Enterprise: 100 teams (placeholder)

### View Teams

**Owner View:**
- See all teams in organization
- Team name, manager, member count
- Actions: view details, delete team

**Admin View:**
- See teams they manage
- Same information display
- Cannot see teams managed by others

**Member View:**
- See only their assigned team
- Limited details
- No management actions

### Team Details

View comprehensive information about a specific team.

**Information Displayed:**
- Team name
- Team manager name and contact
- List of all team members
- Member roles
- Team creation date

**Available Actions:**
- Edit team (change name or manager)
- Add members to team
- Remove members from team
- Delete team

### Edit Team

Modify team information.

**Editable Fields:**
- Team name
- Team manager (reassign to different admin)

**Process:**
1. Open team edit modal
2. Update name or manager
3. Validate changes
4. Save updates
5. Action logged to activity log

**Validations:**
- Team name must be unique
- New manager must be admin
- Cannot remove manager without assigning new one

### Delete Team

Remove a team from the organization.

**Restrictions:**
- Cannot delete team with members
- Must remove or reassign all members first
- Confirmation required

**Process:**
1. Check team has no members
2. Confirm deletion
3. Team deleted from database
4. Manager unlinked from team
5. Action logged to activity log

**Error Handling:**
```
Cannot delete team. Please remove or reassign all 5 members first.
```

---

## Activity Logging

### What Gets Logged

All major organizational actions are automatically logged:

**User Actions:**
- User invited
- Invitation accepted
- User removed
- Role changed (promotion/demotion)
- Bulk invite processed

**Team Actions:**
- Team created
- Team updated (name or manager change)
- Team deleted
- Member added to team
- Member removed from team

**Organization Actions:**
- Organization created
- Organization settings updated
- Admin added
- Admin removed

### Activity Log Display

**Access:**
- Owners: see all organization activity
- Admins: see all organization activity
- Members: no access to activity logs

**Features:**
- Timeline view with color-coded action types
- Filter by date range (start and end date)
- Filter by action type
- Pagination (20 logs per page)
- Detailed information for each action

**Information Displayed:**
- Who performed the action (actor)
- What action was performed
- When it happened (timestamp)
- What was affected (target)
- Additional details (JSON metadata)

**Example Log Entry:**
```
John Doe invited jane@example.com as Admin
2 hours ago
Details: Role assigned: Admin, Invited to: Engineering team
```

### Filtering Activity Logs

**Filter by Date Range:**
- Select start date
- Select end date
- View activity within range
- Clear filters to reset

**Filter by Action Type:**
- All actions
- User invited
- User removed
- Team created
- Team deleted
- Role changed
- And more...

**Pagination:**
- 20 logs per page
- Next/previous navigation
- Jump to specific page
- Total count displayed

### Exporting Activity Logs

Export activity logs for compliance and reporting.

**Export Formats:**
- CSV (comma-separated values)
- JSON (structured data)

**Export Process:**
1. Apply desired filters (optional)
2. Click export button
3. Select format (CSV or JSON)
4. File downloads automatically

**CSV Format:**
```csv
Timestamp,Actor,Action,Target,Details
2024-01-15 10:30:00,John Doe,user_invited,jane@example.com,"role: admin"
```

**JSON Format:**
```json
[
  {
    "timestamp": "2024-01-15T10:30:00Z",
    "actor": "John Doe",
    "action": "user_invited",
    "target": "jane@example.com",
    "details": { "role": "admin" }
  }
]
```

**Use Cases:**
- Compliance audits
- Security reviews
- Troubleshooting issues
- Reporting to stakeholders

---

## Authentication & Security

### Sign Up

New organizations are created through the signup process.

**Required Information:**
- Organization name
- Display name
- Email
- Password

**Process:**
1. User fills signup form
2. System creates Supabase auth user
3. Organization created with free tier
4. User linked to organization as owner
5. Confirmation email sent
6. User redirected to dashboard

**Validations:**
- Email must be unique
- Password strength requirements
- Organization name required
- Display name required

### Sign In

Existing users authenticate to access their organization.

**Features:**
- Email and password authentication
- "Remember me" checkbox for extended sessions
- Redirect to dashboard after successful login
- Error handling for invalid credentials

**Security:**
- Passwords never stored in plaintext
- Session tokens in httpOnly cookies
- Automatic session refresh
- Session expiry after inactivity

### Forgot Password

Users can reset their password via email.

**Process:**
1. Enter email on forgot password page
2. System sends password reset email
3. User clicks link in email
4. Redirected to reset password page
5. Enter new password
6. Password updated in system

**Security:**
- Reset tokens expire after 1 hour
- One-time use tokens
- Secure token generation

### Reset Password

Users complete password reset from email link.

**Features:**
- Token validation
- Password strength requirements
- Confirmation password field
- Success/error feedback

**Validations:**
- Token must be valid and not expired
- New password must meet requirements
- Password and confirmation must match

### Sign Out

Users can end their session securely.

**Process:**
1. Click sign out button
2. Session invalidated
3. Cookies cleared
4. Redirected to landing page

### Session Management

**Features:**
- Automatic session refresh
- Session timeout after 7 days (default)
- Extended session with "remember me" (30 days)
- Secure cookie storage (httpOnly)

**Security:**
- No tokens exposed to JavaScript
- Session validated on every request
- Automatic refresh before expiry

---

## Dashboard

### Role-Based Dashboard Views

Different roles see different dashboard content.

**Owner Dashboard:**
- Welcome message with time-based greeting
- Quick stats (total teams, admins, members)
- Quota usage with progress bars
- Recent activity timeline
- Quick action buttons (create team, invite admin, view activity)

**Admin Dashboard:**
- Welcome message with time-based greeting
- Stats for teams they manage
- Quota information (read-only)
- Recent activity timeline
- Quick action buttons (create team, invite member)

**Member Dashboard:**
- Welcome message
- Their team information
- Team members list
- Profile quick access
- Limited actions

### Dashboard Statistics

**Displayed Metrics:**
- Total teams in organization
- Total admins count
- Total members count
- Quota usage percentages

**Visual Elements:**
- Color-coded stat cards
- Progress bars for quotas
- Icons for each metric
- Responsive layout

### Time-Based Greetings

Dashboard greets users based on current time:
- Morning (5am - 12pm): "Good morning"
- Afternoon (12pm - 5pm): "Good afternoon"
- Evening (5pm - 9pm): "Good evening"
- Night (9pm - 5am): "Good night"

### Recent Activity Widget

Shows last 5 activities for owners and admins.

**Features:**
- Compact timeline view
- Color-coded by action type
- Relative timestamps (e.g., "2 hours ago")
- Link to full activity page

### Quick Actions

**Owner Actions:**
- Create new team
- Invite admin
- View all activity
- Manage members

**Admin Actions:**
- Create new team
- Invite member
- View activity
- Manage your teams

**Member Actions:**
- View your team
- Edit profile

---

## Profile Management

### View Profile

Users can view their profile information.

**Information Displayed:**
- Display name
- Email address
- Avatar (auto-generated from initials)
- Role
- Organization name
- Team name (if assigned)
- Account creation date

### Edit Profile

Users can update their profile information.

**Editable Fields:**
- Display name

**Restrictions:**
- Email cannot be changed (tied to auth)
- Role can only be changed by owner
- Organization cannot be changed
- Team assignment changed by admin/owner

**Process:**
1. Click edit profile
2. Update display name
3. Save changes
4. Profile updated across system

### Avatar System

TeamSync uses auto-generated avatars based on user initials.

**Features:**
- Generated using Avatar Placeholder API
- Based on display name
- Consistent across all views
- No image upload needed

**Example:**
```
User: Basith Ahmed
Avatar URL: https://avatar-placeholder.iran.liara.run/?name=Basith+Ahmed
```

**Future Improvements:**
- Custom avatar upload
- Gravatar integration
- Avatar color customization

---

## Resource Quotas

### Quota System

Organizations are limited by their tier.

**Free Tier Limits:**
- 5 teams maximum
- 25 members maximum (total, including owner and admins)

**Quota Enforcement:**
- Checked before creating teams
- Checked before inviting users
- Checked during bulk invites
- Clear error messages when limit reached

### Quota Display

**Dashboard Widget:**
- Visual progress bars
- Current usage / maximum limit
- Color-coded (green, yellow, red based on usage)
- Percentage calculation

**Example:**
```
Teams: 3/5 (60%)
Members: 18/25 (72%)
```

### Quota Validation

**Before Team Creation:**
```
Error: Team limit reached (5/5). Upgrade your plan to create more teams.
```

**Before User Invitation:**
```
Error: Member limit reached (25/25). Upgrade your plan to invite more users.
```

**During Bulk Import:**
```
Error: Cannot invite 10 users. Only 7 slots available (18/25 used).
```

---

## Email Notifications

### Types of Emails Sent

**Invitation Emails:**
- User invited to organization
- Contains unique invite link
- Expires after 7 days
- Role information included

**Role Change Emails:**
- Promotion to admin
- Demotion to member
- New permissions explained

**Removal Notifications:**
- Admin access revoked
- Member removed from team
- Reason included (if provided)

**Password Reset:**
- Reset link with token
- Expires after 1 hour
- Instructions included

### Email Templates

All emails follow consistent branding:
- Organization name in subject
- Professional formatting
- Clear call-to-action buttons
- Support contact information

---

## Summary

TeamSync provides a comprehensive set of features for managing multi-tenant organizations:

- Complete user lifecycle management (invite, manage, remove)
- Flexible team structure with admin-managed teams
- Detailed activity logging and export
- Role-based access control
- Resource quota management
- Secure authentication and session handling

For visual examples of these features, see [SCREENSHOTS.md](./SCREENSHOTS.md).

For setup instructions, see [SETUP.md](./SETUP.md).

For architecture details, see [ARCHITECTURE.md](./ARCHITECTURE.md).

