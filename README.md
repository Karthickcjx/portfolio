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

## Deployment and credential migration

Credentials are loaded from the ignored `.env` file; Compose no longer contains credentials.
Quote the password hash with single quotes in `.env` so its dollar signs remain literal.
The local credentials were rotated during the security fix. The new local password is in
`.admin-bootstrap.json` (ignored by Git and Docker). Store it securely, then remove that file.
Update the deployment's environment with the new hash and secret and restart it to invalidate
old signed cookies. Removing tracked values does not remove them from Git history; the old
values must never be reused.

This Compose setup expects HTTPS termination in front of the app for admin cookies.
Set `TRUST_PROXY=1` only behind a trusted reverse proxy that replaces forwarding headers,
and restrict direct access to the backend. With direct HTTP access, secure admin cookies
will not work in production.

### Existing Docker installation

Do not delete the old `portfolio-data` volume. It contains both application files and live data.
Before switching to the new Compose configuration:

1. Stop writes and back up `/app/data` and `/app/public/assets` from the existing container
   (for example, `docker cp portfolio:/app/data ./portfolio-backup-data` and
   `docker cp portfolio:/app/public/assets ./portfolio-backup-assets`). Protect the message backup.
2. Build and create the replacement container with `docker compose build` and
   `docker compose create --force-recreate`. The new named volumes mount only `/app/data`
   and `/app/public/assets`; source code comes from the image.
3. Restore the contents of those backups into the stopped replacement container using
   `docker cp ./portfolio-backup-data/. portfolio:/app/data/` and
   `docker cp ./portfolio-backup-assets/. portfolio:/app/public/assets/`.
4. Start with `docker compose start`, then verify the portfolio, uploaded photo, admin login,
   and inbox over HTTPS. Retain the backup and old volume until verification is complete.

For a fresh deployment, the image seeds the new volumes with the bundled portfolio and assets.
Back up both persistent volumes. Do not run `docker compose down -v` on live content.

## Verification

Run `npm test` and `npm run check`. Tests use temporary directories and isolated credentials;
they do not modify the real portfolio or inbox. The homepage renders portfolio content on the
server, with JavaScript adding interactive features afterward.
