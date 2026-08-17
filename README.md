# ✈️ TripNest — MERN Trip Organizer

A full-stack trip organizing application built with **React + TailwindCSS**, **Node.js**, **Express**, and **MongoDB**.

---

## 🗂️ Project Structure

```
trip-organizer/
├── client/               # React frontend (Create React App + Tailwind CSS)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx          # Top nav with auth dropdown trigger
│   │   │   ├── AuthDropdown.jsx    # Login/Register dropdown with validation
│   │   │   └── ProtectedRoute.jsx  # Route guard for dashboard
│   │   ├── context/
│   │   │   └── AuthContext.jsx     # Global auth state (login, register, logout)
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx     # Full landing page
│   │   │   └── Dashboard.jsx       # Protected dashboard
│   │   ├── App.js                  # Routes setup
│   │   └── index.css               # Tailwind + Google Fonts
│   └── tailwind.config.js
│
├── server/               # Node.js + Express backend
│   ├── config/
│   │   └── db.js                   # MongoDB connection
│   ├── models/
│   │   └── User.js                 # Mongoose User schema (bcrypt hashing)
│   ├── middleware/
│   │   └── auth.js                 # JWT protect middleware
│   ├── routes/
│   │   └── auth.js                 # /register, /login, /me, /logout
│   ├── server.js                   # Express app entry
│   └── .env.example                # Environment variables template
│
└── package.json          # Root scripts with concurrently
```

---

## 🚀 Quick Start

### 1. Clone & Install

```bash
# Install root deps
npm install

# Install client deps
cd client && npm install

# Install server deps
cd ../server && npm install
```

### 2. Configure Environment

```bash
cd server
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
```

**.env file:**
```env
MONGODB_URI=mongodb://localhost:27017/tripnest
JWT_SECRET=your_super_secret_jwt_key_change_in_production
PORT=5000
CLIENT_URL=http://localhost:3000
```

> **MongoDB Atlas (Cloud):**
> Replace MONGODB_URI with your Atlas connection string:
> `mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/tripnest`

### 3. Run Development Servers

```bash
# From root — runs both client & server concurrently
npm run dev

# OR run separately:
npm run start:server   # Server on :5000
npm run start:client   # Client on :3000
```

---

## 🔐 Authentication Flow

```
Landing Page
    ↓ (click "Register Now" button in navbar)
Auth Dropdown (inline, no new page)
    ├── Sign In tab → email + password validation → login → Dashboard
    └── Sign Up tab → name + email + password + confirm → register → Dashboard

Dashboard (protected route)
    → Redirects to / if no valid token
```

### Validation Rules

| Field | Rules |
|-------|-------|
| Name | Required, min 2 chars |
| Email | Required, valid format |
| Password | Min 8 chars, 1 uppercase, 1 number |
| Confirm Password | Must match password |

### JWT Token
- Stored in `localStorage`
- 7-day expiry
- Sent as `Authorization: Bearer <token>` header
- Auto-loaded on refresh via `AuthContext`

---

## 🎨 UI Features

- **Landing page** matching the Nexcent-style green theme
- **Sticky navbar** with scroll shadow effect
- **Auth dropdown** with smooth slide-down animation
- **Password strength indicator** on register
- **Real-time field validation** with green/red feedback
- **Dashboard** with sidebar, trip cards, stats, activity feed
- Floating trip card animation in hero section
- Responsive design (mobile menu included)

---

## 📡 API Endpoints

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/api/auth/register` | Public | Register new user |
| POST | `/api/auth/login` | Public | Login user |
| GET | `/api/auth/me` | Private | Get current user |
| POST | `/api/auth/logout` | Private | Logout |
| GET | `/api/health` | Public | Health check |

---

## 🧱 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6 |
| Styling | Tailwind CSS, Google Fonts |
| HTTP Client | Axios |
| Backend | Node.js, Express 4 |
| Database | MongoDB with Mongoose |
| Auth | JWT (jsonwebtoken) |
| Validation | express-validator (server), custom hooks (client) |
| Password | bcryptjs (12 rounds) |
| Dev Tools | nodemon, concurrently |

---

## 📝 Next Steps

- [ ] Add trip CRUD operations (create, edit, delete trips)
- [ ] Itinerary builder with drag-and-drop
- [ ] Budget tracker with charts
- [ ] Google Maps integration
- [ ] File uploads for travel documents
- [ ] Email verification on register
- [ ] Password reset flow
- [ ] Social OAuth (Google, Facebook)
