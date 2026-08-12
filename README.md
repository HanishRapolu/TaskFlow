# TaskFlow 🚀

TaskFlow is a **multi-tenant project management SaaS** where companies are split into **workspaces (projects)**, and each workspace has its own team with strict **role-based access control**. It ships with a secure email-invitation onboarding flow, an admin approval workflow for tasks, and background email jobs.

Built with a **Node.js/Express backend** using a **Controller → Service → Repository** architecture, and a **React (Vite) frontend**.

---

## 🎯 What TaskFlow Does

- **Companies → Workspaces → Tasks**: An owner creates a company, then creates one or more project workspaces inside it. Each workspace has its own team, tasks, and invites.
- **Three roles per workspace**: `Owner`, `Admin`, and `Member` — with different powers.
- **Secure onboarding**: Invite teammates by email with a 24-hour hashed token. Existing users just log in to accept; new users create an account in the same step.
- **Approval workflow**: Tasks created/assigned by Members stay **pending approval** until an Admin or Owner approves them (rejecting one deletes it). Pending tasks are only visible to Admins/Owners.
- **Team management**: Owners can remove members/admins, Admins can remove members, and pending invites can be revoked.
- **Lifecycle deletion with email notifications**: Workspaces and companies can be deleted (owner only) — teammates are notified, and deleting a company sends everyone a *thank-you* email.

---

## 🛠️ Tech Stack

| Layer      | Technology |
|------------|-----------|
| Backend    | Node.js, Express 5, MongoDB (Mongoose 9) |
| Frontend   | React 19, Vite, React Router, Axios |
| Auth       | Dual-token JWT (short-lived access token + refresh token in an HttpOnly cookie), Zod validation |
| Background | BullMQ + Redis for async email delivery |
| Email      | Nodemailer with Brevo SMTP |
| Real-time  | Socket.io with Redis adapter |

---

## 🏗️ Architecture & Data Model

```
Company (owner, name)
└── Workspace / "Project" (name, description, companyId, owner)
    ├── Members: [{ userId, role: owner | admin | member, joinedAt }]
    ├── Tasks:   [{ title, status, assignedTo, createdBy, isApproved }]
    └── Invites: [{ email, role, hashedToken, expiresAt (24h) }]
```

- Registering a user auto-creates a company named `"{Name}'s Company"` and makes them its **owner**.
- An owner can create many workspaces inside the company. Every workspace the owner creates automatically adds them as an `owner` member.
- A person may belong to **only one workspace per company** (as admin or member). Owners are exempt because they own the whole company. This is enforced on invites, direct adds, and invite acceptance.

### 🔐 Role-Based Access Control

| Capability | Owner | Admin | Member |
|-----------|:-----:|:-----:|:------:|
| View tasks | ✅ | ✅ | ✅ (only approved) |
| Create tasks | ✅ | ✅ | ✅ |
| Assign tasks to anyone | ✅ | ✅ (self + members, not owner) | ✅ (self + other members) |
| Auto-approved when assigned by | ✅ | ✅ | ❌ (member→member needs approval) |
| Approve / reject pending tasks | ✅ | ✅ | ❌ |
| Delete tasks | ✅ | ✅ | ❌ |
| Invite by email | ✅ (admins & members) | ✅ (members only) | ❌ |
| Add existing users | ✅ | ✅ | ❌ |
| Revoke pending invites | ✅ | ✅ | ❌ |
| Remove members/admins | ✅ | ✅ (members only) | ❌ |
| Delete the workspace | ✅ | ❌ | ❌ |
| Delete the company | ✅ | ❌ | ❌ |

### ✅ Task Approval Workflow

1. A **Member** assigns a task to another Member (or creates an unassigned task) → the task is created with `isApproved: false` (**pending approval**).
2. Pending tasks are visible **only to Admins and Owners** (shown in the "Needs approval" filter).
3. Admins/Owners can **Approve** (task becomes visible to the whole team) or **Reject** (the task is **permanently deleted**).
4. Tasks assigned by Owners/Admins are approved instantly and visible to everyone.

---

## ✉️ Email System

All emails are sent **asynchronously** through a BullMQ queue and processed by a worker (`src/workers/emailWorker.js`):

| Email job | When it's sent |
|-----------|----------------|
| `sendInviteEmail` | Someone is invited to a workspace (contains the secure 24-hour accept link) |
| `sendMemberRemoved` | An Admin/Owner removes a member from a workspace |
| `sendWorkspaceDeleted` | An Owner deletes a workspace (sent to the remaining teammates) |
| `sendCompanyDeleted` | An Owner deletes the company — a *thank-you for your contribution* email to everyone |

---

## 🔐 Authentication & Invitation Flow

- **Register/Login**: Passwords are hashed with bcrypt. A 15-minute access token is kept in memory/localStorage, and a 7-day refresh token lives in an HttpOnly cookie. Zod validates input.
- **Invitation**:
  1. Owner/Admin invites an email → backend hashes a random token, stores it with a 24h expiry, and queues an email.
  2. The recipient opens `/accept-invite/:token`.
  3. If they **already have an account**, they log in with their existing password to accept.
  4. If they're **new**, they create a name + password, which also registers them.
  5. The token is verified, consumed (deleted), and the user is added to the workspace.
- **One admin per workspace** is enforced (existing admin member or a pending admin invite blocks a second one).

---

## 🖥️ Frontend Pages

| Route | Page | Purpose |
|-------|------|---------|
| `/login` `/register` | Login / Register | Authentication |
| `/accept-invite/:token` | AcceptInvite | Join a workspace from an email invite |
| `/select-workspace` | WorkspaceSelection | Home hub — lists your company and the workspaces you're in |
| `/c/:companyId` | CompanyView | Company overview — create/delete workspaces, delete the company |
| `/w/:workspaceId` | Dashboard | The workspace — **Tasks**, **Members & Invites**, **Settings** tabs |

**Dashboard tabs**
- **Tasks**: stats, search, status/approval filters, task cards, create task, assign, approve/reject.
- **Members & Invites**: current members list, pending invites (revocable), invite by email, add existing member, role permissions.
  - Members see a read-only **Members** list of the workspace team.
- **Settings** (owner only): workspace details + the **danger zone** to delete the workspace.

---

## 🏃 Setup Guide

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [MongoDB](https://www.mongodb.com/try/download/community) running locally on port `27017` (or MongoDB Atlas)
- An [Upstash Redis](https://upstash.com/) database (free plan) for the email queue + Socket.io adapter

> Upstash's REST API doesn't support the Redis protocol commands BullMQ and Socket.io need, so the app connects to the Upstash Redis **protocol endpoint** (port 6379 over TLS) using the REST token as the password. No local Redis is required.

### 2. Install dependencies (backend + frontend)
```bash
npm install
cd client && npm install && cd ..
```

### 3. Environment variables
Create a `.env` file in the project root:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/taskflow
JWT_ACCESS_SECRET=supersecretjwtkey123
JWT_REFRESH_SECRET=supersecretrefreshkey123
CLIENT_URL=http://localhost:5173

# Upstash Redis (from the Upstash dashboard)
UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-rest-token

# Brevo SMTP Configuration for Email
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=your-brevo-smtp-username
SMTP_PASS=your-brevo-smtp-password
SMTP_FROM="TaskFlow <noreply@taskflow.com>"

# Optional: Brevo HTTP API key (xkeysib-...). Preferred for cloud hosting
# (Render/Vercel) where outbound SMTP is often blocked. When set, it takes
# priority over the SMTP config above. Generate it in Brevo > SMTP & API > API keys.
BREVO_API_KEY=
```

The frontend reads `VITE_API_URL` from `client/.env` (see `client/.env.example`). Point it at your deployed backend on Render (e.g. `https://your-api.onrender.com`), and set the backend's `CLIENT_URL` to your deployed frontend (e.g. `https://your-app.vercel.app`) so CORS allows it.

### 4. Start the servers (two terminals)
**Terminal 1 — Backend:**
```bash
npm run dev     # or: node src/index.js
```
**Terminal 2 — Frontend:**
```bash
cd client
npm run dev
```
Open **http://localhost:5173**. The backend runs on **http://localhost:5000**.

> ⚠️ After pulling code changes, **restart the backend** so new API routes are picked up.

---

## 📁 Project Structure

```
TaskFlow/
├── client/                    # React (Vite) frontend
│   └── src/
│       ├── components/        # Modal, Spinner, TaskCard, ProtectedRoute
│       ├── context/           # AuthContext, ToastContext
│       ├── pages/             # Login, Register, AcceptInvite, WorkspaceSelection, CompanyView, Dashboard
│       └── utils/api.js       # Axios instance (JWT + refresh interceptor)
└── src/                       # Backend
    ├── config/                # DB, queue (BullMQ), socket
    ├── controllers/           # Request handlers (thin)
    ├── services/              # Business logic
    ├── repositories/          # Data access (Mongoose queries)
    ├── middlewares/           # protect (JWT), authorizeWorkspace, authorizeCompany, validate, errors
    ├── models/                # User, Company, Workspace, Task, Invite
    ├── routes/                # auth, user, task, workspace, company
    ├── utils/                 # AppError, mailer, workspaceRules
    ├── validators/            # Zod schemas
    ├── workers/               # BullMQ email worker
    └── index.js               # App entry point
```

---

## 📡 API Overview

All endpoints are prefixed with `/api`.

**Auth** — `/api/auth`
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/register` | Register a user (auto-creates their company) |
| POST | `/login` | Log in |
| POST | `/logout` | Log out |
| POST | `/refresh-token` | Refresh the access token |
| GET | `/invites/:token` | Validate an invite link |
| POST | `/register-invited` | Accept an invite (log in or create account) |

**Users** — `/api/users`
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/me/workspaces` | Companies owned + workspaces the user belongs to |

**Companies** — `/api/companies`
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/` | Create a company |
| GET | `/me` | Get the caller's owned company |
| GET | `/:companyId` | Get a company (owner only) |
| DELETE | `/:companyId` | **Delete the company** — emails everyone, deletes all workspaces/tasks/invites |
| GET | `/:companyId/workspaces` | List workspaces (owner only) |
| POST | `/:companyId/workspaces` | Create a workspace (owner only) |

**Workspaces** — `/api/workspaces`
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/:workspaceId` | Workspace details + caller's role |
| GET | `/:workspaceId/members` | Members + pending invites |
| POST | `/:workspaceId/members` | Add an existing user directly |
| DELETE | `/:workspaceId/members/:userId` | Remove a member/admin |
| POST | `/:workspaceId/invite` | Send an email invite |
| DELETE | `/:workspaceId/invites/:inviteId` | Revoke a pending invite |
| DELETE | `/:workspaceId` | Delete the workspace (owner only) |

**Tasks** — `/api/workspaces/:workspaceId/tasks`
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/` | List tasks (members see approved tasks only) |
| POST | `/` | Create a task |
| PUT | `/:taskId/status` | Update status (assignee or admin/owner) |
| PUT | `/:taskId/assign` | Assign/reassign a task (role rules apply) |
| PUT | `/:taskId/approve` | Approve a pending task (admin/owner) |
| PUT | `/:taskId/reject` | Reject a pending task — **deletes it** (admin/owner) |
| DELETE | `/:taskId` | Delete a task (admin/owner) |

---

## 🔒 Security Notes
- Passwords are never returned by the API (`select: false`) and are hashed with bcrypt.
- Invite tokens are stored **hashed** (SHA-256) and expire after 24 hours.
- Every workspace/company action is gated by `protect` (JWT) + `authorizeWorkspace`/`authorizeCompany` (RBAC).
- Zod schemas validate all auth input.
- CORS is locked to the frontend origin via the `CLIENT_URL` env var.
