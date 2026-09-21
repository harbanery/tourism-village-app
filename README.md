<a name="readme-top"></a>

<div align="center">
  <a href="https://github.com/harbanery/tourism-village-app">
    <img src="./public/icon.png" alt="Logo" width="80">
  </a>

  <h1 align="center">DesakuWisataku</h1>

  <p align="center">
    Tourism Village Web App — Paket Wisata, Pembayaran QRIS & Panel Admin
    <br />
    <br />
  </p>
</div>

## Table of Contents

- [Table of Contents](#table-of-contents)
- [About The Project](#about-the-project)
  - [Built With](#built-with)
- [The Story](#the-story)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Setup Environment Variables](#setup-environment-variables)
  - [Database Setup](#database-setup)
  - [Running the Application](#running-the-application)
- [Usage](#usage)
  - [Features](#features)
  - [Google Sign-In (SSO)](#google-sign-in-sso)
  - [Project Structure](#project-structure)
  - [Payment Flow (Midtrans QRIS)](#payment-flow-midtrans-qris)
  - [Automated Notifications](#automated-notifications)
  - [Multi-Language](#multi-language)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)
- [Acknowledgements](#acknowledgements)

## About The Project

My web-based application, **DesakuWisataku**, is a full-stack tourism village platform that connects visitors with a fictional Indonesian village's tourism offerings. Visitors can browse places and travel packages, read articles, watch video documentation, and book packages end-to-end: cart → checkout → **Midtrans QRIS payment** → e-ticket & invoice PDF — all with real-time in-app notifications. A dedicated **admin panel** manages content (places, packages, blog, sponsors, testimonials), orders, and accounts, complete with a Chart.js analytics dashboard. Logging in is frictionless: **Google SSO** (OAuth redirect — not Firebase, no popups) registers the account on first sign-in and only asks for a password afterwards — no manual forms required.

The application runs in two payment modes with **zero code changes**:

- When `MIDTRANS_SERVER_KEY` is **set**, payments are charged through the **Midtrans Core API** (QRIS POS) — sandbox or production depending on `MIDTRANS_ENV`.
- When `MIDTRANS_SERVER_KEY` is **empty**, the app automatically falls back to a **built-in payment simulator** so the whole booking flow stays demoable without Midtrans credentials.

### Built With

[![Next][Next.js]][Next-url]
[![TypeScript][TypeScript]][TypeScript-url]
[![Tailwind][Tailwind]][Tailwind-url]
[![Ant Design][Ant Design]][Ant Design-url]
[![Prisma][Prisma]][Prisma-url]
[![PostgreSQL][PostgreSQL]][PostgreSQL-url]

## The Story

Indonesian villages hold some of the most beautiful tourism experiences in the country, yet most of them are still promoted through word of mouth and scattered social media posts. Travelers cannot see what packages exist, how much they cost, or how to book — and village managers have no simple tool to manage it all.

**DesakuWisataku** is my answer to that gap: a single platform where a village can present its places, packages, articles, and videos professionally, while visitors get a smooth booking experience with modern QRIS payment. The admin panel is designed so a non-technical village operator can manage everything — content, orders, and customers — without touching a line of code.

This project is as much a showcase of a production-grade architecture (Next.js 16 App Router, Prisma, Midtrans, Cloudinary, cron automation) as it is a usable product for a real-world problem.

## Getting Started

To get a local copy up and running follow these simple steps.

### Prerequisites

- Node.js (v20+)
- npm

  ```sh
  npm install npm@latest -g
  ```

- PostgreSQL database (e.g. [Railway](https://railway.app/) or local)

### Installation

1. Clone Repo

   ```sh
   git clone https://github.com/harbanery/tourism-village-app.git
   ```

2. Go to folder directory

   ```bash
   cd tourism-village
   ```

3. Install NPM packages

   ```sh
   npm install
   ```

### Setup Environment Variables

1. Create a `.env` file in your local root directory (copy from `.env.example`).

2. Add the following variables to the `.env` file:

   ```sh
   # Database (Prisma)
   DATABASE_URL="postgresql://user:password@host:port/dbname"

   # App identity (optional, for branding/metadata)
   TITLE_WEB="DesakuWisataku"
   APP_WEB="DesakuWisataku"
   DESCRIPTION_WEB="Website desa wisata DesakuWisataku — paket wisata, galeri, vlog, dan artikel."
   NEXT_PUBLIC_URL="http://localhost:3000"

   # Midtrans (Core API — QRIS POS). Kosong = simulator pembayaran lokal.
   MIDTRANS_SERVER_KEY=""
   MIDTRANS_ENV="sandbox"

   # SMTP (Nodemailer) — email OTP, kredensial admin, notifikasi order
   SMTP_HOST=""
   SMTP_PORT="465"
   SMTP_SECURE="true"
   SMTP_USER=""
   SMTP_PASS=""
   SMTP_FROM=""
   NOTIFICATION_LOCALE="id"

   # Cloudinary — upload gambar (paket, blog, avatar, sponsor)
   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=""
   NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=""
   CLOUDINARY_API_KEY=""
   CLOUDINARY_API_SECRET=""

   # Secret endpoint cron (/api/cron/*)
   CRON_SECRET="your-cron-secret"

   # Google SSO (bukan Firebase) — kosong = SSO nonaktif
   GOOGLE_CLIENT_ID=""
   GOOGLE_CLIENT_SECRET=""
   ```

### Database Setup

1. Generate the Prisma client (runs automatically on `npm install`):

   ```sh
   npm run db:generate
   ```

2. Push the schema to your database:

   ```sh
   npm run db:push
   ```

   Or create a migration:

   ```sh
   npm run db:migrate
   ```

   > Upgrading from a version without Google SSO? The same command applies the
   > new columns (`auth_user.google_id`; `password` becomes nullable for
   > Google-only accounts) — existing data is untouched.

3. Seed initial data (admin accounts, demo places, packages, blog, orders):

   ```sh
   npm run db:seed
   ```

### Running the Application

1. Start the development server:

   ```sh
   npm run dev
   ```

2. Open your browser and locally navigate to:

   ```sh
   http://localhost:3000        # web pengunjung
   http://localhost:3000/admin  # panel admin
   ```

## Usage

This application is a complete tourism village platform: public website, member booking flow with QRIS payment, and an admin panel — all bilingual (Indonesian/English) with dark/light theming.

### Features

- **Next.js 16 App Router** with React Server Components; home page uses **ISR** (60s) so content is server-rendered and revalidated via `revalidateTag` when admins edit data.
- **Route protection** via `src/proxy.ts` (Next.js 16 proxy convention): admin panel, membership pages, and API groups are cookie-gated; logged-in users are kept away from auth forms; membership redirects preserve the `?redirect=` target.
- **Visitor website**: hero with layered crossfade/parallax background, popular places, travel packages, video documentation, testimonials, sponsors, articles/blog, about, terms, privacy, and user agreement pages.
- **Member flow**: package cart → checkout → payment (QRIS) → e-ticket & **invoice PDF** (jsPDF), plus review submission with cooldown, length, and profanity validation.
- **Payment**: **Midtrans Core API** QRIS POS charge with server-side signature verification (constant-time compare); automatic fallback to a local **payment simulator** when Midtrans is not configured; orders expire to `CANCELED` after `PAYMENT_EXPIRY_MINUTES` (default 5) via a cron sweep, also communicated to Midtrans as `custom_expiry`.
- **Authentication**: **Google SSO** (OAuth 2.0 redirect flow — not Firebase, no popups and no third-party scripts: the sign-in button is a plain Ant Design button that redirects to Google's consent page and back) — the authorization code is exchanged and the ID token verified server-side with `google-auth-library`; first sign-in auto-registers the account (email marked verified), then the user is asked to create a password at `/set-password` so manual login still works; the profile shows a **Linked to Google** status with link/unlink actions. Plus email OTP registration verification, login rate limiting, forgot/reset password, session table with per-device listing & revocation, bcrypt hashing.
- **Profile**: avatar upload (Cloudinary signed upload), email change with OTP to the old address, password change with OTP verification, order history, and notification preferences.
- **Realtime notifications**: **SSE stream** (`/api/web/notifications/stream`) with automatic polling fallback; bell component with unread badges in the navbar.
- **Admin panel**: dashboard (revenue trend, order status chart, ratio & status doughnuts, top packages — Chart.js), order management (detail drawer, cancel, Midtrans sync, resend email, invoice), tourism (places & packages), blog (rich-text editor + unique slug generation), sponsors, testimonial moderation (approval + featured), and account/role management (Master/Viewer/Author).
- **Automated emails**: OTP, admin credentials, order events, trip reminders, and a daily summary for admins (email + in-app).
- **Multi-language support** (Indonesian & English) with instant switching, integrated with Ant Design and dayjs locales.
- **Dark/Light mode** with localStorage persistence and system preference detection.
- **PWA-ready**: web manifest, apple-touch icons, and Android icons.
- **Security hardening**: same-origin checks for all mutating API requests, file-upload validation, rich-text sanitization (DOMPurify), masked personal data in logs, and constant-time cron secret comparison.
- **PostgreSQL database** managed via **Prisma ORM** with automatic retry on connection errors.
- **UI components** with **Ant Design** and **Tailwind CSS** styling — Tailwind classes on antd components use the `!` important suffix (or a wrapper `div`) so they reliably win over antd's built-in styles.
- **Navigation** uses `useRouter` from `next/navigation` instead of `<Link>` for consistent client-side behavior.
- **Linting** with **ESLint** for maintaining code quality.

### Google Sign-In (SSO)

Authentication supports **one-click Google sign-in** (OAuth 2.0 redirect flow — not Firebase), so visitors never have to fill in the manual register/login forms:

1. The user clicks the Google button on `/login` or `/register` (a plain Ant Design button — no Google-rendered iframe, no popups, so it can't be blocked by the browser). It navigates to `/api/web/auth/google/start`, which redirects to Google's consent page in the same tab with a CSRF `state` cookie.
2. Google redirects back to `/api/web/auth/google/callback`; the server exchanges the authorization code (using `GOOGLE_CLIENT_SECRET`) and verifies the ID token (`google-auth-library`, audience check against `GOOGLE_CLIENT_ID`).
3. **New Google account** → the account is created automatically (name, email, avatar; email marked verified) — this is the "register without forms" path. The user lands on `/set-password` to **create a password**, then is logged in immediately.
4. **Known Google account** (already linked) → straight login.
5. **Email that already exists** with a verified manual account → the Google account is linked to it automatically; with an _unverified_ manual account, the user must set a password first via a one-time pending token (prevents account takeover).
6. In **Profile → Settings → Security**, a **Linked to Google** badge shows the connection status; users can link (same-email Google accounts only) or unlink (requires a password) their Google account.

To enable it:

1. Open [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → **Create Credentials → OAuth client ID → Web application**.
2. Add your origin(s) under **Authorized JavaScript origins** (e.g. `http://localhost:3000` and your production URL).
3. Add `${NEXT_PUBLIC_URL}/api/web/auth/google/callback` (e.g. `http://localhost:3000/api/web/auth/google/callback`) under **Authorized redirect URIs**.
4. Copy the **Client ID** and **Client Secret** into `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env`. Leave them empty to disable SSO — email/password login keeps working either way.

### Project Structure

The full folder layout and placement rules live in [`public/docs/structure-project.txt`](public/docs/structure-project.txt). In short:

```
src/
├── app/            # Routing only (App Router) + API route handlers
│   ├── (web)/      # (public) | (auth) | (membership) route groups
│   ├── admin/      # (auth) | (panel) — page.tsx + decorator/ + config/
│   └── api/        # web/ | admin/ | cron/ | upload/
├── components/     # Global shared UI (i18n, theme, consent, vercel)
├── features/       # Domain modules: admin/ & web/ (components, hooks, utils, types)
├── hooks/          # Global React hooks (useMounted)
├── lib/            # Third-party clients holding secrets (midtrans, cloudinary, email, prisma, auth, otp, qris)
├── services/       # Data-access layer (Prisma queries + caching)
├── utils/          # config/, helpers/, server/, email/, pdf/, fonts/
└── assets/         # Global CSS (Tailwind 4 + antd theme)
```

- `app/` pages stay thin; feature components live in each route's `section/` (web) or `decorator/` + `config/` (admin).
- `features/<domain>/` holds domain-specific components, session hooks, utils, and types.
- `lib/` is server-side only; pure client components must not import it.

### Payment Flow (Midtrans QRIS)

1. User checks out the cart → an order is created with status `PENDING` and a payment access ticket.
2. The app requests a QRIS charge:
   - **Midtrans configured** → Core API `charge` with `custom_expiry` matching `PAYMENT_EXPIRY_MINUTES`; the QR string is rendered locally.
   - **Simulator mode** → a local QR payload is generated for demo payments.
3. The payment page polls order status (rate-limited) and flips to `PAID` when the charge is settled — verifying Midtrans's `signature_key` in constant time.
4. On success the user gets an e-ticket, an invoice PDF, and in-app + email notifications; admins get notified too.
5. A cron sweep expires stale `PENDING` orders to `CANCELED` (with audit logs via `OrderLog`).

### Automated Notifications

This app supports automated notifications via **Email** (Nodemailer) and **in-app notifications** (SSE) through **Vercel Cron Jobs**:

| Notification      | Schedule                 | Channel        | Description                                                     |
| ----------------- | ------------------------ | -------------- | --------------------------------------------------------------- |
| **Expire Orders** | Every minute (as needed) | Database       | Sweeps `PENDING` orders past the payment deadline to `CANCELED` |
| **Trip Reminder** | Daily, 07:00 WIB         | Email + In-app | H-1 departure reminder for `PAID` orders                        |
| **Daily Summary** | Daily, 21:00 WIB         | Email + In-app | Order & revenue recap for Master admins                         |

To enable notifications:

1. **Email:** Configure SMTP settings (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`).
2. **Cron Jobs:** Set `CRON_SECRET` and deploy the cron configuration to Vercel; every request must send `Authorization: Bearer <CRON_SECRET>`.

### Multi-Language

All UI strings live in a single dictionary: [`src/components/i18n/translations.ts`](src/components/i18n/translations.ts) (`id` and `en` blocks). `LocaleProvider` exposes `t(key, params)` and persists the choice in `localStorage`; `ThemeProvider` feeds the active locale into Ant Design's `ConfigProvider` and dayjs so built-in component texts follow along.

**To add a new language:**

1. Add the locale code to the `Locale` type and `LOCALES` array in `src/components/i18n/translations.ts`
2. Add a new translation block (e.g. `jp: { ... }`) with the same keys
3. Map the locale to Ant Design/dayjs locales in `ThemeProvider` if supported

## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

Distributed under the MIT License.

## Contact

If you have any questions or inquiries regarding this project, feel free to contact me at [ryusuf05@gmail.com](mailto:ryusuf05@gmail.com)

## Acknowledgements

Feel free to check it out:

- [Next.js Documentation](https://nextjs.org/docs)
- [Ant Design](https://ant.design/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Prisma](https://www.prisma.io/)
- [Chart.js](https://www.chartjs.org/)
- [Midtrans Documentation](https://docs.midtrans.com/)
- [Cloudinary Documentation](https://cloudinary.com/documentation)
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
- [google-auth-library](https://github.com/googleapis/google-auth-library-nodejs)
- [Img Shields](https://shields.io)
- [Choose an Open Source License](https://choosealicense.com/)

<!-- MARKDOWN LINKS & IMAGES -->

[Next.js]: https://img.shields.io/badge/next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white
[Next-url]: https://nextjs.org/
[Ant Design]: https://img.shields.io/badge/Ant_Design-1677FF?style=for-the-badge&logo=antdesign&logoColor=white
[Ant Design-url]: https://ant.design/
[Tailwind]: https://img.shields.io/badge/tailwindcss-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white
[Tailwind-url]: https://tailwindcss.com/
[Prisma]: https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white
[Prisma-url]: https://www.prisma.io/
[PostgreSQL]: https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white
[PostgreSQL-url]: https://www.postgresql.org/
[TypeScript]: https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white
[TypeScript-url]: https://www.typescriptlang.org/
