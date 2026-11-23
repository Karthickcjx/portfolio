# Karthick Raja G Portfolio

Production-ready portfolio web application with a protected admin dashboard.

## Features

- Public portfolio served by Express with security headers and compression.
- Portfolio content stored in `data/portfolio.json`.
- Protected admin dashboard at `/admin`.
- Admin authentication uses a server-side username and scrypt password hash.
- Admin sessions use signed HttpOnly cookies plus CSRF protection for writes.
- Login and contact endpoints are rate limited.
- Contact messages are stored locally in `data/messages.json`.

## Local Setup

```bash
npm install
npm run hash-password -- "Your-Strong-Password-Here"
```

Copy `.env.example` to `.env`, then set:


```bash
ADMIN_USERNAME=karthick
ADMIN_PASSWORD_HASH=paste_generated_hash_here
SESSION_SECRET=paste_random_session_secret_here
NODE_ENV=development
```

Generate a session secret with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Start the app:

```bash
npm start
```

Open `http://localhost:3000`.

## Production Notes

- Set `NODE_ENV=production`.
- Set `TRUST_PROXY=1` when running behind a reverse proxy or hosting platform.
- Use HTTPS so the admin cookie is sent as a secure cookie.
- Keep `.env` and `data/messages.json` out of git.
- Back up `data/portfolio.json` if the admin panel is used to edit live content.
