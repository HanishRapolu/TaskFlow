# TaskFlow 🚀

TaskFlow is a modern, Multi-Tenant SaaS project management tool designed for teams. It features a robust Node.js/Express backend using the Service-Repository pattern and a stunning React frontend utilizing Vite and modern design aesthetics.

## 🛠️ Tech Stack
- **Backend**: Node.js, Express, MongoDB (Mongoose), BullMQ (Redis)
- **Frontend**: React, Vite, React Router, Axios, CSS Variables
- **Security**: Dual-token JWT (Access in memory, Refresh in HttpOnly cookies), and strictly enforced Role-Based Access Control (RBAC).
- **Background Jobs**: Asynchronous email delivery via Nodemailer & Brevo SMTP using BullMQ and Redis.

---

## 🏃‍♂️ Local Setup Guide (For your friend!)

### 1. Prerequisites
You need to have the following installed on your machine:
- [Node.js](https://nodejs.org/) (v18+)
- [MongoDB](https://www.mongodb.com/try/download/community) running locally on port `27017`.
- [Docker](https://www.docker.com/) (to run Redis for our background email queues).

### 2. Start Redis via Docker
Open a terminal and run the exact command to spin up Redis in the background:
```bash
docker run -d -p 6379:6379 redis
```

### 3. Install Dependencies
You need to install packages for **both** the backend and the frontend.
```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

### 4. Environment Variables
Create a `.env` file in the root directory and add the following (replace the SMTP placeholders if testing emails):
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/taskflow
JWT_ACCESS_SECRET=supersecretjwtkey123
JWT_REFRESH_SECRET=supersecretrefreshkey123
CLIENT_URL=http://localhost:5173

# Brevo SMTP Configuration for Email Invites
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=your-brevo-smtp-username
SMTP_PASS=your-brevo-smtp-password
SMTP_FROM="TaskFlow <noreply@taskflow.com>"
```

### 5. Start the Servers
You will need two separate terminal windows.
**Terminal 1 (Backend):**
```bash
node src/index.js
```
**Terminal 2 (Frontend):**
```bash
cd client
npm run dev
```

---

## 🏗️ Architecture: Projects & Tasks

We built a highly secure, flat hierarchy system:
- **Projects**: The core container (managed as Workspaces in the DB). A user can create a Project and automatically becomes the **Owner**.
- **Roles**: Users inside a Project are either an `Owner`, `Admin`, or `Member`.
- **Tasks**: Work items attached directly to a Project. 
  - **Admins & Owners**: Have full power. They can assign tasks to anyone, delete tasks, and approve pending tasks.
  - **Members (Workers)**: Can view tasks and update statuses. If a member creates a new task, it defaults to `Pending Approval` until an Admin signs off on it.

## ✉️ Secure Email Invitations
TaskFlow features a highly secure onboarding system:
1. An Owner or Admin invites a user via email from the frontend dashboard.
2. The backend generates a secure, hashed cryptographic token with a 24-hour expiration.
3. **BullMQ** picks up the job in the background and uses **Nodemailer** to send a beautifully formatted HTML email via **Brevo SMTP**.
4. The user clicks the link in the email, lands on the React frontend, sets their password, and the backend securely verifies the token and consumes it!
