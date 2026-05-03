# VaultGuard — Password Vault

## Overview

Full-stack password vault web app ("VaultGuard") built in Portuguese. pnpm workspace monorepo using TypeScript with a React+Vite frontend and Express 5 API backend.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Frontend**: React + Vite, TanStack Query, wouter, shadcn/ui
- **Validation**: Zod (v4), drizzle-zod
- **API codegen**: Orval (from OpenAPI spec at `lib/api-spec/openapi.yaml`)
- **Auth**: JWT (jsonwebtoken) + bcryptjs
- **Crypto**: AES-256-CBC (vault entry encryption), node-forge (RSA certificates)
- **Build**: esbuild (CJS bundle for API server)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)

## Architecture

```
artifacts/
  api-server/    — Express 5 API (port 8080, path prefix /api)
  vault-web/     — React+Vite SPA (port 20293, path prefix /)
lib/
  api-spec/      — OpenAPI spec (openapi.yaml) + orval config
  api-client-react/ — Generated React Query hooks (from orval)
  api-zod/       — Generated Zod schemas (from orval)
  db/            — Drizzle ORM schema + migrations
```

## Features

- **Two vault item categories**: `credencial` (values masked) and `variavel_global` (values visible)
- **Vault items**: key-value dictionaries with granular access control ("all" or specific users)
- **30-day audit logs**: all accesses logged (user, datetime, IP, user agent, vault item)
- **Strong password policy**: 12+ chars, uppercase, lowercase, number, special char
- **Per-user API key generation** (stored as SHA-256 hash, shown raw once)
- **Client certificate generation** (RSA 2048, node-forge) + PEM download via web UI
- **JWT auth** (24h expiry, stored in localStorage as `vault_token`)

## Pre-seeded Users

| Role  | Username | Email             | Password           |
|-------|----------|-------------------|--------------------|
| Admin | master   | master@local.com  | Otopodomundo182*   |
| User  | demo     | demo@local.com    | DC9H"lz70O\8aa     |

Both are shown on the login screen as clickable demo credential cards.

## DB Schema (lib/db/src/schema/)

- `users` — id, username, email, password_hash, full_name, role
- `api_keys` — id, user_id, name, key_hash, key_prefix, is_active, last_used_at
- `certificates` — id, user_id, name, public_key, private_key, fingerprint, is_active, expires_at
- `vault_items` — id, name, category, description, access_control, created_by
- `vault_entries` — id, vault_item_id, key, encrypted_value (AES-256-CBC)
- `vault_item_access` — vault_item_id, user_id (for specific access control)
- `audit_logs` — id, user_id, vault_item_id, action, ip_address, user_agent, created_at

## API Routes

- `POST /api/auth/register` — register (password strength enforced)
- `POST /api/auth/login` — login → returns JWT token
- `POST /api/auth/logout`
- `GET /api/auth/me` — current user (requires JWT)
- `POST /api/auth/change-password` — (requires JWT, strong password)
- `GET/PATCH/DELETE /api/users/:id` — user management (admin for PATCH/DELETE)
- `GET/POST /api/vault` — list/create vault items
- `GET /api/vault/stats` — stats (total items, entries, accessible)
- `GET/PATCH/DELETE /api/vault/:id` — read/update/delete (access-controlled, logs on GET)
- `GET/POST /api/apikeys` — list/create API keys
- `DELETE /api/apikeys/:id` — revoke API key
- `GET/POST /api/certificates` — list/generate certificates
- `DELETE /api/certificates/:id` — revoke certificate
- `GET /api/certificates/:id/download` — download PEM bundle
- `GET /api/logs` — audit logs (last 30 days, paginated, filterable)
- `GET /api/logs/stats` — audit statistics (top items, recent activity)
