# TaskFlow 🚀

TaskFlow is a modern, Multi-Tenant SaaS project management tool. It features a robust Node.js/Express backend using the Service-Repository pattern and a stunning React frontend utilizing Vite and glassmorphism design.

## 🛠️ Tech Stack
- **Backend**: Node.js, Express, MongoDB (Mongoose), Socket.io, BullMQ (Redis), Zod
- **Frontend**: React, Vite, React Router, Axios, CSS Variables
- **Security**: Dual-token JWT (Access in memory, Refresh in HttpOnly cookies), strictly enforced Role-Based Access Control (RBAC), and Cryptographic Email Invitations.

---

## 🏃‍♂️ Local Setup Guide (For your friend!)

### 1. Prerequisites
You need to have the following installed on your machine:
- [Node.js](https://nodejs.org/) (v18+)
- [MongoDB](https://www.mongodb.com/try/download/community) running locally on port `27017` (or a Mongo Atlas URI).
- [Docker](https://www.docker.com/) (to run Redis for our background queues and WebSockets).

### 2. Start Redis via Docker
Open a terminal and run the exact command we used to spin up Redis in the background:
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
Create a `.env` file in the root directory (where the backend `package.json` is) and add the following:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/taskflow
JWT_SECRET=supersecretjwtkey123
JWT_REFRESH_SECRET=supersecretrefreshkey123
CLIENT_URL=http://localhost:5173
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

## 🧪 How to Use the App (The Postman & Frontend Flow)

We built a highly secure onboarding system. Here is exactly how you add an "Owner" and invite an "Admin".

### Step 1: Create an Owner
We made it so Owners can create their accounts directly on the website.
1. Open your browser and go to: `http://localhost:5173/register`
2. Fill out your Name, Email (e.g., `owner@company.com`), and Password.
3. Click **Sign Up as Owner**. 
4. The system automatically creates a brand new Workspace in the database and assigns you the `owner` role!

### Step 2: Get the Owner's Token & Workspace ID
Open **Postman** to simulate API interactions.
1. **Login**: Make a `POST` request to `http://localhost:5000/api/auth/login`
   - Body (JSON): `{"email": "owner@company.com", "password": "yourpassword"}`
   - *Copy the `accessToken` from the response.*
2. **Get Workspace ID**: Make a `GET` request to `http://localhost:5000/api/users/me/workspaces`
   - Headers: `Authorization: Bearer <paste_token_here>`
   - *Copy your `workspaceId` from the response.*

### Step 3: Invite the Admin via Postman
Now the Owner invites a new manager (Admin) to the company.
1. Make a `POST` request to `http://localhost:5000/api/workspaces/<WORKSPACE_ID>/invite`
2. Headers: `Authorization: Bearer <paste_token_here>`
3. Body (JSON):
```json
{
  "email": "admin@company.com",
  "role": "admin"
}
```
4. *Look at the response!* Since we aren't using a real SMTP email service yet, the backend will spit out the raw secure `inviteLink` directly in the Postman response. Copy it!

### Step 4: The Admin Joins!
1. Take that `inviteLink` (it will look like `http://localhost:5173/accept-invite/a1b2c3d4...`) and paste it into your browser.
2. You will be taken to a beautiful, secure "Accept Invitation" screen.
3. Notice that the email is securely locked to `admin@company.com`.
4. Enter the Admin's name and create a password, then click **Join Workspace**.
5. The system verifies the cryptographic token, deletes it so it can't be reused, creates the account, and automatically adds the Admin to the Owner's workspace!

You will then be seamlessly redirected to the Workspace Selection screen where you can view your beautiful dashboard cards!
