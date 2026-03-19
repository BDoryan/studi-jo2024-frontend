# Studi JO 2024 – Frontend

React application exposing the ticketing system for the Paris 2024 Olympic and Paralympic Games: marketing journey, offer browsing, authentication, and user account access.

## Main Stack

* Vite + React 18 (TypeScript)
* Tailwind CSS with a custom Paris 2024 theme
* React Router for navigation
* Integration with business APIs via `src/lib/api`

## Prerequisites

* Node.js 18+
* npm (or pnpm/yarn depending on your preference)

## Installation

```bash
npm install
```

## Run the project

```bash
npm run dev
```

The application is available at `http://localhost:5173`.

## Useful scripts

* `npm run dev`: development server with hot reload.
* `npm run build`: production build in `dist/`.
* `npm run preview`: local preview of the build.
* `npm run test`: runs the test suite (Vitest + Testing Library) in CI mode.
* `npm run test:watch`: runs tests in interactive watch mode.

## Quick structure

* `src/components`: generic components (Header, Footer, Button, etc.).
* `src/blocks`: reusable page sections (Hero, Presentation…).
* `src/pages`: full pages used by the router.
* `src/lib`: helpers, authentication logic, and API clients.
* `src/pages/__tests__`: integration tests covering main flows (login, signup, account).
* `src/tests`: shared testing utilities (render helpers with router, etc.).
* `public/imgs`: static assets (logos, visuals).

## Two-factor authentication flow

* During login (`/auth/customer/login` or `/auth/admin/login`), the API may return `two_factor_required: true` along with a `challenge_id`.
* The frontend then displays a second OTP form (6 digits) and calls `AuthApi.verifyLogin` with `{ challenge_id, code }` on the corresponding `/verify` endpoint.
* Until verification is completed, no JWT is stored. The final token is persisted exactly as before.
* Code errors (expired/invalid) are displayed in the OTP field, and a “Resend code” callback is already wired on the UI but disabled pending backend support.

## Backend

For more details about the backend project (API and business logic), see:
[https://github.com/BDoryan/studi-jo2024-backend](https://github.com/BDoryan/studi-jo2024-backend)
