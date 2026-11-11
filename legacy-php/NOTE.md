# legacy-php/ — the untouched 2018 original

This folder is the Conscenery codebase exactly as it was published in
December 2018 (14 commits, last commit `5349acc` "Update README.md"), moved
here byte-for-byte during the November 2026 monorepo restructure. Nothing in
this folder has been edited — the only addition is this NOTE.md file, and the
empty runtime file `error_log` was left behind (it contained nothing).

## What it is

A flat-file PHP / MySQL (LAMP) prototype of a lightweight messaging and
sharing service where every message has a set expiry date. `index.php` is a
front controller (switch on URL path, borrowed from a Google App Engine
example); `main.php` is the single HTML shell; `sys.js` (jQuery 3.1.1) polls
every 5 seconds and reloads HTML fragments for the stream, DMs, and contacts.

## What it needs to run (and what was never committed)

- PHP 7+ with mysqli, and a MySQL database.
- **`config.php` was never committed.** Several files `require`/`include` it
  for the database connection, so the app does **not** run from a fresh clone
  as-is. You must create it yourself, e.g.:

  ```php
  <?php
  $db = mysqli_connect('localhost', 'USER', 'PASSWORD', 'conscenery');
  ```

- **No schema file was ever committed.** The tables are inferred from the
  queries: `USERS` (ID, USERNAME, EMAIL, PASSWORD, ACTIVE, JOINED, STATUS),
  `NETWORK` (ID, USER1, USER2, STATUS 0=connected / 1=pending / 2=blocked,
  DIRECTION), `MESSAGES` (SRC_ID, DEST_ID, STREAM, CONTENT, FILE, ORIGINAL,
  FILESIZE, FILETYPE, POST_TIME, EXPIRY_TIME).

## Frozen history

This folder is frozen history — please don't "fix" it here. Fixes, ports, and
new features belong in `../modern/`. If you need the pre-restructure repo,
it is tagged `v1-php-2018` on commit `5349acc`.
