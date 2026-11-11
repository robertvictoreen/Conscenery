# Conscenery

A lightweight messaging and sharing service where every message has a set
expiry date — so there is no extensive digital history. Originally built in
December 2018 to understand how complex social media sites are; revived in
November 2026 as a two-implementation monorepo.

> **Seeded demo logins (both implementations):** `Demo` / `Demo`, and
> `robert` / `robert`. New users are auto-connected to Demo, so the feed
> opens with Demo's "Hello" and robert's "This is awesome!" — the two posts
> from `demo.png` — instead of an empty stream.

## Layout

| Folder | What it is | Run it |
|--------|------------|--------|
| [`legacy-php/`](legacy-php/) | The untouched 2018 original — flat-file PHP + MySQL (LAMP). Frozen history. | See [`legacy-php/NOTE.md`](legacy-php/NOTE.md). Needs `config.php` + MySQL, neither of which was ever committed. |
| [`modern/`](modern/) | A clean-room port of the same app — Node + SQLite, zero dependencies. Same screens, same expiry rules, same Demo seeding. | `cd modern && node server.js`, then http://localhost:3000. See [`modern/README.md`](modern/README.md). |

The two implementations share nothing at runtime — no shared code, no shared
database. They are two ports of one idea, kept side by side so the original
stays readable and the port stays runnable.

## What changed in the port (and what didn't)

Kept: About page, register/login rules (alphanumeric 6–30 chars, email
validation), Demo autofill login, Generate Demo Account, contact-gated
Stream (self right / received left), posts with 30min–48h expiry and lazy
purge on load, contacts (add / accept / cancel / block / unblock / remove),
DMs per contact, delete own messages, 5-second refresh.

Fixed in the port: passwords are scrypt-hashed (never plaintext — the 2018
login also accepted a plaintext match); accept/block/delete are POSTs, not
GET links; prepared statements throughout; the DM query's AND/OR precedence
bug is fixed; and there is a change-password endpoint (the original had no
reset flow at all). Uploads stay disabled in both — the file inputs are
commented out in the shipped `main.php`.

## History

- **Dec 2018** — original PHP/MySQL prototype, 14 commits. Frozen as tag
  [`v1-php-2018`](https://github.com/robertvictoreen/Conscenery/releases/tag/v1-php-2018)
  on the last pre-restructure commit.
- **Nov 2026** — monorepo restructure: original moved byte-for-byte into
  `legacy-php/` (see `legacy-php/NOTE.md`), modern port added in `modern/`.
  The restructuring commit is on `main`.

## License

MIT — see [`LICENSE`](LICENSE).
