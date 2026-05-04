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

- **Two vault item categories**: `credencial` (values masked in browser, real values only via API key) and `variavel_global` (values always visible)
- **Vault items**: key-value dictionaries with granular access control ("all" or specific users)
- **VM/Host-based API access control**: each vault item has `allowedHostsMode` ("all" or "specific") and `allowedHosts` (string[]) — when accessing via API key, the server checks the requester's IP against the allowed hosts list
- **Credential protection in browser**: values of `credencial` items are NEVER returned for browser (JWT) sessions — always `[PROTEGIDO]`; real values only returned via API key auth with a permitted IP
- **Full edit mode on vault detail page**: all fields editable (name, category, description, access control, allowed users, allowed hosts, entries)
- **AES-256-CBC encryption at rest** for all vault entry values; empty value in update = keep existing encrypted value
- **Dual auth middleware**: `requireAuthOrApiKey` — accepts `X-API-Key` header (SHA-256 hashed, validated against api_keys table) OR `Authorization: Bearer` JWT
- **30-day audit logs**: all accesses logged (user, datetime, IP, user agent, vault item)
- **Strong password policy**: 12+ chars, uppercase, lowercase, number, special char
- **Per-user API key generation** (stored as SHA-256 hash, shown raw once)
- **Client certificate generation** (RSA 2048, node-forge) + PEM download via web UI
- **JWT auth** (24h expiry, stored in localStorage as `vault_token`)
- **Per-user TOTP 2FA** (otplib v13, QR code via `qrcode`): setup/confirm/disable on Profile page; 2FA step on login
- **Admin password reset**: admin resets a user's password from Users page → user must set new password on next login (blur-triggered dialog on login page)
- **Enable/Disable users**: admin can toggle user `is_active`; disabled users cannot log in; guard prevents disabling the last active admin
- **Settings page** (admin only): toggle `show_demo_credentials` to show/hide the demo credential cards on the login page
- **Username blur → check reset**: on login page, when username field loses focus, calls `GET /api/auth/check-reset?username=` and shows mandatory password reset dialog if required
- **Public manual pages** (no auth): `/manual` (browser operations manual in PT-BR with mock UI screenshots) and `/api-manual` (API reference with curl/Python/Node.js examples)

## Pre-seeded Users

| Role  | Username    | Email                  | Password           |
|-------|-------------|------------------------|--------------------|
| Admin | master      | master@local.com       | Otopodomundo182*   |
| Admin | demo_admin  | demo_admin@local.com   | DC9H"lz70O\8aa     |
| User  | demo        | demo@local.com         | DC9H"lz70O\8aa     |
| User  | demo_user   | demo_user@local.com    | DC9H"lz70O\8aa     |

Demo admin and demo_user are shown on the login screen as clickable demo credential cards (toggled by settings).

## DB Schema (lib/db/src/schema/)

- `users` — id, username, email, password_hash, full_name, role, **is_active**, **requires_password_reset**, **totp_secret**, **totp_enabled**
- `settings` — id, key (unique), value
- `api_keys` — id, user_id, name, key_hash, key_prefix, is_active, last_used_at
- `certificates` — id, user_id, name, public_key, private_key, fingerprint, is_active, expires_at
- `vault_items` — id, name, category, description, access_control, **allowed_hosts_mode**, **allowed_hosts** (JSON array string), created_by
- `vault_entries` — id, vault_item_id, key, encrypted_value (AES-256-CBC)
- `vault_item_access` — vault_item_id, user_id (for specific access control)
- `audit_logs` — id, user_id, vault_item_id, action, ip_address, user_agent, created_at

## API Routes

- `POST /api/auth/register` — register (password strength enforced)
- `POST /api/auth/login` — login → JWT or `{ requiresTwoFactor, tempToken }` or `{ requiresPasswordReset }`
- `POST /api/auth/logout`
- `GET /api/auth/me` — current user (requires JWT)
- `POST /api/auth/change-password` — (requires JWT, strong password)
- `GET /api/auth/check-reset?username=` — public; returns `{ requiresReset, isActive }`
- `POST /api/auth/set-password` — public; body `{ username, newPassword }`; clears requiresPasswordReset
- `POST /api/auth/2fa/setup` — generates TOTP secret + QR code (requires JWT)
- `POST /api/auth/2fa/confirm` — body `{ otp }`; activates 2FA (requires JWT)
- `POST /api/auth/2fa/disable` — body `{ otp }`; disables 2FA (requires JWT)
- `POST /api/auth/2fa/verify` — body `{ tempToken, otp }`; completes 2FA login (public)
- `GET /api/users` — list users with is_active, requires_password_reset, totp_enabled (admin)
- `GET/PATCH/DELETE /api/users/:id` — user management (admin for PATCH/DELETE)
- `POST /api/users/:id/reset-password` — admin resets user password (sets requires_password_reset)
- `PATCH /api/users/:id/toggle-active` — admin enable/disable user (guards ≥1 active admin)
- `GET /api/settings` — list settings (public)
- `PATCH /api/settings` — body `{ key, value }` (admin)
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
