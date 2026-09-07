# Yajib-App — Phase 1: User + Registration

Food-delivery platform, built **one class / one module at a time** using a
layered, OOP architecture in **TypeScript + Next.js (App Router)**.

**Phase 1 scope:** the `User` domain class and **registration only**.
There is deliberately **no login / logout / session / RBAC** yet — those come
in later phases.

---

## Architecture & data flow

```
Registration Form  (/register — client component)
        │  POST /api/auth/register  { name, email, phone, password, confirmPassword }
        ▼
API route          (src/app/api/auth/register/route.ts)  — thin HTTP adapter
        ▼
RegisterUserUseCase (src/application/auth)               — business process
        │           validate → normalize → email unique? → hash → create → save
        ▼
User domain class  (src/domain/user/User.ts)             — invariants / OOP
        │
        ├─ PasswordHasher (port) → Argon2PasswordHasher   (Argon2id)
        └─ UserRepository (port) → PrismaUserRepository
                                        ▼
                                     Prisma → PostgreSQL
```

Dependencies point **inward**: the UI/API depend on the application layer, the
application depends on domain **ports/interfaces**, and infrastructure (Prisma,
Argon2) is injected at the composition root
(`registerUserUseCaseFactory.ts`). The domain never imports Next.js, Prisma,
HTTP, cookies, or a database driver.

### Layer responsibilities

| Layer | Objects | Responsibility |
|---|---|---|
| **Domain** | `User`, `UserRole`, `UserRepository` (interface) | Identity, roles, always-valid invariants, persistence contract |
| **Application** | `RegisterUserUseCase` | Registration orchestration & business rules (no framework code) |
| **Infrastructure** | `PrismaUserRepository`, `Argon2PasswordHasher`, `PrismaClient` | DB access & hashing — the only layer that knows Prisma/Argon2 |
| **Shared** | `errors/*`, `validation/*` | Stable error codes and framework-free validators |
| **UI/API** | `register/page.tsx`, `RegistrationForm.tsx`, `route.ts` | Presentation + HTTP transport |

There is no god `UserService` — each class has one reason to change.

---

## Project structure

```
src/
├── app/
│   ├── register/
│   │   ├── page.tsx                 # /register (server page + metadata)
│   │   ├── RegistrationForm.tsx     # client form (sends NO role)
│   │   └── register.module.css
│   ├── api/auth/register/route.ts   # POST /api/auth/register (registration only)
│   ├── layout.tsx
│   ├── page.tsx                     # landing with link to /register
│   └── globals.css
├── domain/
│   └── user/
│       ├── User.ts                  # aggregate: private ctor, create(), reconstitute()
│       ├── UserRole.ts              # CUSTOMER | RESTAURANT_OWNER | DRIVER | ADMIN
│       └── UserRepository.ts        # persistence port (interface)
├── application/
│   └── auth/
│       ├── RegisterUserUseCase.ts       # the registration use case
│       └── registerUserUseCaseFactory.ts# composition root (wires infra)
├── infrastructure/
│   ├── database/PrismaClient.ts         # singleton PrismaClient
│   ├── repositories/PrismaUserRepository.ts
│   └── security/
│       ├── PasswordHasher.ts            # port (interface)
│       └── Argon2PasswordHasher.ts      # Argon2id implementation
└── shared/
    ├── errors/                          # AppError, ValidationError, ConflictError, ErrorCode
    └── validation/                      # name/email/phone normalizers + password policy

prisma/schema.prisma                     # User model + Role enum (PostgreSQL)
scripts/verify-pglite.ts                 # dev-only e2e check using in-process Postgres
```

---

## Local development

### Prerequisites

- Node.js 20+
- A local **PostgreSQL** database.

### 1. Configure the database

```bash
cp .env.example .env
# then edit .env -> DATABASE_URL to point at your local Postgres, e.g.:
# DATABASE_URL="postgresql://postgres:postgres@localhost:5432/yajib?schema=public"
```

Create the database (example with the `createdb` CLI):

```bash
createdb yajib        # or: CREATE DATABASE yajib; via psql
```

### 2. Generate the client & create tables

```bash
npm install
npm run db:generate   # prisma generate
npm run db:migrate    # prisma migrate dev  (creates the users table + Role enum)
# (no migrations yet? alternatively: npm run db:push)
```

### 3. Run

```bash
npm run dev
# open http://localhost:3000            -> landing
# open http://localhost:3000/register   -> registration form
```

---

## API

### `POST /api/auth/register`

Request (the browser sends **no `role`** — it is always `CUSTOMER`):

```json
{
  "name": "Ahmed",
  "email": "ahmed@example.com",
  "phone": "0550000000",
  "password": "StrongPassword123!",
  "confirmPassword": "StrongPassword123!"
}
```

`201 Created`:

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "…",
      "name": "Ahmed",
      "email": "ahmed@example.com",
      "phone": "0550000000",
      "role": "CUSTOMER"
    }
  }
}
```

Error responses never leak internals:

```json
{ "success": false, "error": { "code": "EMAIL_ALREADY_EXISTS", "message": "…" } }
```

Error codes: `VALIDATION_ERROR`, `INVALID_NAME`, `INVALID_EMAIL`,
`INVALID_PHONE`, `WEAK_PASSWORD`, `PASSWORD_MISMATCH`, `EMAIL_ALREADY_EXISTS`,
`INTERNAL_ERROR`.

---

## Security decisions

- **Argon2id** password hashing (`@node-rs/argon2`), OWASP-aligned parameters
  (19 MiB memory, t=2, p=1), auto-salted; only the PHC hash is stored.
- **Plaintext passwords are never stored.** The domain receives only the hash.
  `confirmPassword` is form-only: compared then discarded, never persisted.
- **Responses never include** `password` or `passwordHash` (`User.toPublic()`).
- **Role is decided server-side** — public registration is hard-wired to
  `CUSTOMER` (`PUBLIC_REGISTRATION_ROLE`); the client cannot escalate.
- **Always-valid domain**: `User` cannot be constructed with an empty name,
  malformed email/phone, empty hash, or invalid role (private constructor +
  factories).
- **Email uniqueness** enforced both by the use case and a DB unique index.
- **Generic 500s** for unexpected failures — no stack traces or DB errors
  returned to clients.

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start dev server (http://localhost:3000) |
| `npm run build` | `prisma generate` + production build |
| `npm run start` | Start the production server |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Run Vitest unit tests |
| `npm run db:migrate` | Apply/create Prisma migration |
| `npm run db:push` | Push schema to DB without a migration |
| `npm run db:studio` | Open Prisma Studio |

---

## Not in this phase (by design)

Login, logout, sessions, Restaurant, Driver, Order, Delivery, Payment,
Admin, RBAC middleware, notifications, maps. **Stopping after User + Register.**
