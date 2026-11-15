# CareCircle – Elderly Care & Medication Management Platform

> A production-quality, accessible full-stack MERN application connecting elderly individuals, family caregivers, and healthcare providers for medication scheduling, vital check-ins, and emergency alert coordination.

---

## Architecture & Technology Stack

- **Frontend**: React 18, Vite, JavaScript (JSX), Tailwind CSS, Lucide Icons, Axios, Socket.IO Client.
- **Backend**: Node.js (ES Modules), Express.js, Socket.IO, Helmet, Morgan, CORS.
- **Database**: MongoDB with Mongoose ODM (connection pooling & resilient auto-reconnect).
- **Authentication**: JWT (JSON Web Tokens) & bcryptjs password hashing.
- **Real-Time Communication**: Socket.IO for caregiver push alerts and broadcast rooms.
- **Email Notifications**: Nodemailer (SMTP/Mailtrap/Gmail ready).
- **Scheduled Automation**: node-cron for medication reminders and daily status checks.

---

## Directory Structure

```text
hackathon/
├── package.json                 # Root script runner (concurrent execution)
├── .gitignore                   # Workspace gitignore
├── README.md                    # Setup and architectural documentation
│
├── server/                      # Express.js & Node backend API
│   ├── .env.example             # Documented server environment variables
│   ├── .env                     # Local environment settings
│   ├── .gitignore               # Server-specific ignore rules
│   ├── package.json             # Backend dependencies & lifecycle scripts
│   └── src/
│       ├── config/
│       │   ├── env.js           # Validated, immutable environment configuration
│       │   ├── cors.js          # Dynamic CORS policy configuration
│       │   └── db.js            # Resilient MongoDB Mongoose connection manager
│       ├── controllers/
│       │   └── health.controller.js  # Telemetry & health inspection controller
│       ├── middlewares/
│       │   ├── errorHandler.middleware.js # Centralized global error handler
│       │   └── notFound.middleware.js     # Standard 404 route handler
│       ├── models/              # Mongoose data models (ready for auth & domain)
│       ├── routes/
│       │   ├── api.router.js    # Root API router (/api/v1)
│       │   └── health.router.js # Health check endpoint (/api/v1/health)
│       ├── services/            # Business logic and external service integrations
│       ├── sockets/
│       │   └── socket.js        # Socket.IO instance and event channels
│       ├── utils/
│       │   ├── ApiError.js      # Structured operational error class
│       │   ├── ApiResponse.js   # Standardized API response envelope
│       │   └── asyncHandler.js  # Async wrapper eliminating boilerplate try/catch
│       ├── app.js               # Express application pipeline & middleware configuration
│       └── server.js            # Server entrypoint with HTTP & graceful shutdown handling
│
└── client/                      # Vite + React frontend application
    ├── .env.example             # Documented client environment variables
    ├── .env                     # Local client environment settings
    ├── .gitignore               # Client-specific ignore rules
    ├── index.html               # Accessible HTML entrypoint with font preconnect
    ├── package.json             # Frontend dependencies & Vite scripts
    ├── postcss.config.js        # PostCSS configuration for Tailwind
    ├── tailwind.config.js       # Custom theme palette for healthcare accessibility
    ├── vite.config.js           # Vite build & reverse-proxy configuration
    └── src/
        ├── assets/              # Static media and brand assets
        ├── components/
        │   ├── common/
        │   │   ├── Button.jsx   # Accessible multi-variant button
        │   │   ├── Card.jsx     # Structured card container
        │   │   ├── Header.jsx   # Navigation header with live status badge
        │   │   └── Footer.jsx   # Informational footer
        │   └── feedback/
        │       ├── Loader.jsx   # Animated loading spinner
        │       └── StatusBadge.jsx # Dynamic multi-state badge
        ├── context/             # React Context providers (Auth, Socket)
        ├── hooks/
        │   └── useHealthCheck.js # Live health diagnostics hook
        ├── layouts/
        │   └── MainLayout.jsx   # Global layout shell
        ├── pages/
        │   └── Dashboard.jsx    # Foundation diagnostics & architecture dashboard
        ├── services/
        │   └── api.js           # Pre-configured Axios client with interceptors
        ├── utils/               # Client-side helper utilities
        ├── App.jsx              # Root React component
        ├── index.css            # Tailwind directives & accessibility styling
        └── main.jsx             # DOM bootstrap entrypoint
```

---

## Directory Purpose Guide

| Directory | Purpose |
| :--- | :--- |
| `server/src/config/` | Isolates all runtime configuration (environment validation, database connection pooling, and CORS security rules). |
| `server/src/controllers/` | Request handlers that orchestrate business logic and format responses using `ApiResponse`. |
| `server/src/middlewares/` | Global error handling, route-not-found handling, authentication checks, and input validators. |
| `server/src/utils/` | Reusable utilities: `ApiError` hierarchy, `ApiResponse` formatter, and `asyncHandler` higher-order function. |
| `server/src/sockets/` | Real-time Socket.IO instance and notification rooms (circle channels, caregiver alerts). |
| `client/src/services/` | Axios client configured with automatic base URL routing, JWT token injection, and response parsing. |
| `client/src/components/` | Modular design system with accessible buttons, cards, badges, and feedback components. |
| `client/src/hooks/` | Custom hooks encapsulating stateful logic and API interactions. |

---

## Environment Variables

### Server (`server/.env`)
```bash
NODE_ENV=development
PORT=5000
API_PREFIX=/api/v1
CLIENT_URL=http://localhost:5173
MONGODB_URI=mongodb://127.0.0.1:27017/carecircle
JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters_long
JWT_EXPIRES_IN=7d
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your_user
SMTP_PASS=your_password
EMAIL_FROM="CareCircle Support <noreply@carecircle.local>"
```

### Client (`client/.env`)
```bash
VITE_API_BASE_URL=http://localhost:5000/api/v1
VITE_SOCKET_URL=http://localhost:5000
VITE_APP_NAME="CareCircle"
```

---

## Getting Started

### 1. Install Dependencies
Run from the workspace root:
```bash
# Installs root, server, and client dependencies
npm run install:all
```
Or individually:
```bash
cd server && npm install
cd ../client && npm install
```

### 2. Run Both Frontend and Backend Concurrently
From the workspace root:
```bash
npm run dev
```

### 3. Run Individually
- **Run Backend Only**:
  ```bash
  npm run dev:server
  # or
  cd server && npm run dev
  ```
  API is live at `http://localhost:5000`.

- **Run Frontend Only**:
  ```bash
  npm run dev:client
  # or
  cd client && npm run dev
  ```
  Client is live at `http://localhost:5173`.

---

## Health Check API

Endpoint: `GET http://localhost:5000/api/v1/health`

### Sample Response:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "System is healthy and operational",
  "data": {
    "service": "CareCircle API",
    "status": "healthy",
    "environment": "development",
    "timestamp": "2026-11-15T09:21:34.819Z",
    "uptime": "14.2s",
    "database": {
      "status": "connected",
      "connected": true,
      "name": "carecircle"
    },
    "memory": {
      "heapUsedMB": "18.43",
      "rssMB": "75.07"
    },
    "version": "1.0.0"
  },
  "timestamp": "2026-11-15T09:21:34.820Z"
}
```

---

## Architectural Highlights

1. **Centralized Error Handling**:
   - `ApiError` class standardizes status codes, operational flags, and error details.
   - Global `errorHandler` captures Mongoose validation errors, CastErrors, duplicate key constraints, and JWT expiration.
   - Stack traces are securely omitted in production mode.

2. **Standardized Responses**:
   - Every API endpoint returns `{ success, statusCode, message, data, timestamp }`.

3. **Resilient Database Layer**:
   - Mongoose connection handles timeouts gracefully without crashing during development if MongoDB starts later.
   - Reconnection listeners and clean disconnects upon `SIGINT`/`SIGTERM`.

4. **Real-Time Integration Ready**:
   - Express server wrapped with native Node HTTP and Socket.IO server.
   - CORS origin validation aligned between REST and WebSockets.
