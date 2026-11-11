# Conscenery — modern port

A clean-room reimplementation of the 2018 Conscenery prototype
(`../legacy-php/`) in **Node + SQLite, zero dependencies**. Same product:
a lightweight messaging/sharing service where every message has an expiry
date. No PHP, no MySQL, no build step.

## Run it

```sh
node server.js          # or: npm start
# open http://localhost:3000
```

Requires Node ≥ 22.5 (`node:sqlite`). The first run creates
`conscenery.db` next to `server.js` and seeds it. That file is gitignored —
never commit a live database.

```sh
PORT=4000 node server.js            # different port
CONSCENERY_DB=/tmp/demo.db node server.js   # different database
```

## Seeded accounts

| Username | Password | Notes |
|----------|----------|-------|
| `Demo`   | `Demo`   | Demo account; "Demo Account Login" autofills these, as in the original |
| `robert` | `robert` | Connected to Demo, with the two demo.png posts |

Both start with the two Stream posts from the original `demo.png` —
Demo's "Hello" and robert's "This is awesome!" — which expire 48 hours
after first run, like every other post.

## Features (mirroring the original)

- **About** page with the original demo screenshot (served from
  `../legacy-php/demo.png` — no duplicate binary in this folder).
- **Register / Login** — same rules as `register.php`: usernames and
  passwords alphanumeric, 6–30 characters; valid email required. New users
  are auto-connected to Demo, so the feed is seeded, not empty.
- **Generate Demo Account** — fills the register form with a random
  6-character username, matching `sys.js`.
- **Stream** — posts from connected contacts (and yourself), self on the
  right, received on the left, Montserrat / `#333` header / `#4CAF50`
  green, exactly like `main.css`. Refreshes every 5 seconds.
- **Post with expiry** — 30 mins / 1 hour / 6 hours / 12 hours / 24 hours /
  48 hours (48h pre-selected in the form; the server falls through to 1h,
  as `post.php` did). Expired posts are lazily purged when the Stream or a
  DM thread loads, with a live "expires in …" countdown.
- **Contacts** — add by username, pending requests (accept / cancel),
  block / unblock / remove. Direct messages per contact.
- **Delete** your own messages.
- **Change password** — `Profile → Change Password`. New in this port:
  the original had no reset flow at all.

## What deliberately differs from the 2018 code

- **Passwords are scrypt-hashed** (`scrypt$salt$hash`), never stored in
  plain text. The 2018 `login.php` accepted a plaintext match *or*
  `password_verify()` — this port only verifies a hash.
- **No GET side-effects.** Accept / block / delete are POSTs with a
  session cookie; the original did them via GET links.
- **Prepared statements everywhere** — no string-built SQL.
- **The DM query is correct.** The original `stream_messages.php` had an
  AND/OR precedence bug that ignored the `STREAM` filter on one branch.
- **Text-only.** Uploads stay disabled, as in the shipped `main.php`
  (both file inputs are commented out there).

## API

All JSON under `/api/*`, session via HttpOnly `conscenery_session` cookie.

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/register` | POST | `{username, email, password}` |
| `/api/login` | POST | `{username, password}` |
| `/api/logout` | POST | — |
| `/api/me` | GET | current user |
| `/api/change-password` | POST | `{currentPassword, newPassword}` (logs out everywhere) |
| `/api/stream` | GET | contact-gated Stream, expired purged |
| `/api/post` | POST | `{text, timeSelection, destId?}` — `destId` for a DM |
| `/api/delete` | POST | `{id}` — own messages only |
| `/api/contacts` | GET | connected + pending/blocked |
| `/api/contact-request` | POST | `{username}` |
| `/api/contact-action` | POST | `{userId, action: accept\|remove\|block\|unblock}` |
| `/api/dm?userId=` | GET | DM thread, expired purged |

## Files

```
modern/
  server.js          # HTTP server + SQLite + API (single file, no deps)
  public/
    index.html       # one shell: About / Login / Stream / Contacts / Profile
    styles.css       # look carried over from legacy-php/main.css
    app.js           # fetch client, 5s refresh, Demo autofill
  package.json       # Node ≥ 22.5, `npm start`
  README.md          # this file
  .gitignore         # db files, uploads, .env, node_modules
```
