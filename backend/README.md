# Campus Maintenance Request System API

## Configuration

Keep the existing `.env` private and untracked. Add the following settings to
that file without replacing its existing MongoDB URI or other values:

```env
JWT_SECRET=<a-random-secret-of-at-least-32-characters>
FRONTEND_ORIGIN=http://localhost:5173
SMTP_HOST=<your-smtp-host>
SMTP_PORT=<your-smtp-port>
SMTP_SECURE=<true-or-false>
SMTP_USER=<your-smtp-username>
SMTP_PASSWORD=<your-smtp-password>
SMTP_FROM=<verified-sender-address>
```

Generate a secret locally, for example with PowerShell:

```powershell
node -e "console.log(require('node:crypto').randomBytes(64).toString('base64url'))"
```

Copy the generated value directly into your private `backend/.env`; do not
commit or share it. The API refuses to start when the secret is missing or
shorter than 32 characters. In production, set `NODE_ENV=production` and set
`FRONTEND_ORIGIN` to the exact HTTPS origin serving the frontend.
Password reset email requires all six SMTP settings above. Use the hostname,
port, TLS mode, username, and password provided by your email provider, and a
sender address that provider permits. Keep these values private in
`backend/.env`; do not commit or share credentials.

## Create the first ICT Admin

There is no public ICT Admin registration endpoint. Once MongoDB and the
environment are configured, run `npm run seed:admin` from `backend/` in a
private interactive terminal. The script prompts for the initial admin's
profile and reads the password without echoing it. It refuses to create a
second ICT Admin; no credentials are hardcoded.

## Authentication and authorization

Passwords are hashed with bcryptjs. Access JWTs expire after 15 minutes and
are sent in an HttpOnly, SameSite=Strict cookie; the browser frontend does not
persist tokens in local or session storage. Mutating API requests must
originate from the configured frontend origin.

The roles are `STAFF`, `ICT_ADMIN`, `ICT_TECHNICIAN_TEAM_LEAD`, and
`ICT_TECHNICIAN`. Public registration always creates `STAFF`. Only
authenticated `ICT_ADMIN` users may use user management endpoints. Role and
active status are re-read from MongoDB for each authenticated request.

## API

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/forgot-password` (request a 6-digit email code)
- `POST /api/auth/verify-reset-otp` (verify the code and receive a short-lived reset token)
- `POST /api/auth/reset-password` (use the reset token to set a new password)
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `POST /api/requests` (Staff; submit a request)
- `GET /api/requests/my-requests` (Staff; list only the authenticated user's requests)
- `GET /api/requests/:id` (Staff; request owner only)
- `POST /api/users/create-team-lead` (ICT Admin)
- `POST /api/users/create-technician` (ICT Admin)
- `GET /api/users` (ICT Admin)
- `PATCH /api/users/:userId/status` (ICT Admin; JSON `{ "isActive": boolean }`)
- `PATCH /api/users/:userId/role` (ICT Admin; JSON `{ "role": "..." }`)
- `GET /api/admin/dashboard/stats` (ICT Admin; database-backed totals)
- `GET /api/admin/users` (ICT Admin; optional `search` and `role` query parameters)
- `GET /api/admin/requests` (ICT Admin; optional `status`, `category`, and `priority` query parameters)
- `POST /api/admin/users` (ICT Admin; creates an `ICT_TECHNICIAN` or `ICT_TECHNICIAN_TEAM_LEAD` account)
- `PATCH /api/admin/users/:id/status` (ICT Admin; JSON `{ "isActive": boolean }`)

Admin dashboard statistics return `totalUsers`, `totalStaff`, `totalTechnicians`,
`totalRequests`, `pendingRequests` (status `PENDING`), and `completedRequests`
(statuses `RESOLVED` and `CLOSED`). The technician total counts `ICT_TECHNICIAN`
accounts; Team Leads remain a distinct role. Admin user responses omit password
hashes. Admin account creation does not allow creating or promoting an Admin.

The frontend must send requests with credentials enabled. Login and
registration create an HttpOnly cookie; logout clears it.

Password reset codes are generated with a cryptographically secure random
generator, stored only as keyed hashes, expire after 10 minutes, and allow at
most five verification attempts. Reset requests and verification are
rate-limited by client IP. The reset token returned after OTP verification is
short-lived and required to change the password; successful password reset
clears the OTP and reset challenge. Forgot-password responses do not disclose
whether an email address is registered. Configure SMTP before using this flow.

Request submissions use the authenticated user's account as the requester;
requester identity, role, status, and technician assignment are not accepted
from the client. Image uploads are not currently supported.

Run backend tests with `npm test`.
