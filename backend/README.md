# Campus Maintenance Request System API

## Configuration

Keep the existing `.env` private and untracked. Add the following settings to
that file without replacing its existing MongoDB URI or other values:

```env
JWT_SECRET=<a-random-secret-of-at-least-32-characters>
FRONTEND_ORIGIN=http://localhost:5173
```

Generate a secret locally, for example with PowerShell:

```powershell
node -e "console.log(require('node:crypto').randomBytes(64).toString('base64url'))"
```

Copy the generated value directly into your private `backend/.env`; do not
commit or share it. The API refuses to start when the secret is missing or
shorter than 32 characters. In production, set `NODE_ENV=production` and set
`FRONTEND_ORIGIN` to the exact HTTPS origin serving the frontend.

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

The frontend must send requests with credentials enabled. Login and
registration create an HttpOnly cookie; logout clears it.

Request submissions use the authenticated user's account as the requester;
requester identity, role, status, and technician assignment are not accepted
from the client. Image uploads are not currently supported.

Run backend tests with `npm test`.
