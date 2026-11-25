# Task Manager

A small task manager: a NestJS REST API and a Next.js web app.

```
api/   NestJS 12 REST API for tasks (in-memory storage)
web/   Next.js 16 App Router + shadcn/ui front end
```

## Run it from a fresh clone

### Prerequisites

- **Node.js 24** (LTS). Built and tested on 24.18. Node 22.22 or newer should also work but was not tested. Check with `node -v`.
- **npm**, which ships with Node. Tested with npm 11.

Nothing else is needed: no database, no Docker, no global packages.

### 1. Start the API

In a terminal, from the repository root:

```bash
cd api
npm install
npm run start:dev
```

Wait for the line `API ready at http://localhost:3001/tasks`. Leave this terminal running.

### 2. Start the web app

In a second terminal, from the repository root:

```bash
cd web
npm install
npm run dev
```

Open **http://localhost:3000**.

### Environment variables

None are required. Both apps have defaults that work together, so you can skip this section.

To change a value, copy the example file and edit the copy:

| App | Copy | Variable | Default | Meaning |
|---|---|---|---|---|
| `api` | `.env.example` to `.env` | `PORT` | `3001` | Port the API listens on |
| `api` | | `WEB_ORIGIN` | `http://localhost:3000` | Origin(s) allowed to call the API from a browser (CORS). Comma-separated. |
| `web` | `.env.example` to `.env.local` | `NEXT_PUBLIC_API_URL` | `http://localhost:3001` | Base URL of the API |

Restart the app after changing its file.

### Database

There is none, so there is nothing to install, create or migrate. Tasks are kept in memory, so the list starts empty and **is cleared whenever the API restarts**. In watch mode (`npm run start:dev`) that includes every time a file in `api/` is saved. See [How tasks are stored](#how-tasks-are-stored) for the details and [Decisions](#decisions) for why.

### Tests and checks

```bash
cd api
npm test            # unit tests for the service
npm run test:e2e    # every endpoint over HTTP, including the 400 and 404 cases
npm run lint

cd ../web
npm run lint
npm run build
```

### If something does not work

- **The page says it could not reach the API.** The API is not running, or it runs on another port. Start it (step 1), or set `NEXT_PUBLIC_API_URL`.
- **Port 3000 is taken**, so Next.js starts on another port (it prints which). The API then blocks the page, because only `http://localhost:3000` is allowed by default. Set `WEB_ORIGIN` in `api/.env` to the address Next.js printed and restart the API.
- **Port 3001 is taken.** Set `PORT` in `api/.env` and `NEXT_PUBLIC_API_URL` in `web/.env.local` to the same new port.
- **Open the app at `localhost`, not `127.0.0.1`.** To the browser those are two different origins, and only the first is allowed by default.

## API

Base URL: `http://localhost:3001`

| Method | Path | Success | Errors |
|---|---|---|---|
| `GET` | `/tasks` | `200`, array of tasks, newest first | |
| `GET` | `/tasks/:id` | `200`, the task | `404` |
| `POST` | `/tasks` | `201`, the created task | `400` |
| `PATCH` | `/tasks/:id` | `200`, the updated task | `400`, `404` |
| `DELETE` | `/tasks/:id` | `204`, no body | `404` |

Every endpoint is rate limited to 100 calls per minute per IP address. Over the limit, the API answers `429`.

A task:

```json
{
  "id": "46547460-8134-4ff0-97e1-e8066d3d7ae0",
  "title": "Set up CI",
  "description": null,
  "status": "TODO",
  "dueDate": "2026-12-04",
  "createdAt": "2026-11-23T11:23:25.687Z"
}
```

Request body rules, for `POST` and `PATCH`:

| Field | Rule |
|---|---|
| `title` | Required on `POST`. String, 1 to 120 characters after trimming. |
| `description` | Optional. String, up to 1000 characters. `null` or `""` means none. |
| `status` | Optional. `TODO`, `IN_PROGRESS` or `DONE`. Defaults to `TODO` on `POST`. |
| `dueDate` | Optional. A real calendar date as `YYYY-MM-DD`. `null` means none. |

On `PATCH`, a field that is left out is not changed. Unknown fields are rejected with `400`.

Errors use NestJS's standard body. `message` is an array for validation errors and a string otherwise:

```json
{ "statusCode": 400, "message": ["title should not be empty"], "error": "Bad Request" }
```

## How tasks are stored

Tasks live in the API process's memory, in a JavaScript `Map` (key: task id, value: the task). There is no database and no file on disk.

A request passes through three layers, each with one job:

| Layer | File | Job |
|---|---|---|
| Controller | `api/src/tasks/tasks.controller.ts` | HTTP only: reads the request, calls one service method. |
| Service | `api/src/tasks/tasks.service.ts` | The rules: creates the id (`randomUUID()`), sets `createdAt`, defaults the status to `TODO`, answers `404` for a missing task. |
| Repository | `api/src/tasks/tasks.repository.ts` | Storage only. The one file that knows tasks are kept in a `Map`. |

The repository has four methods:

- `findAll()` returns every task, oldest first. A `Map` keeps insertion order; the service reverses it so the API answers newest first.
- `findById(id)` returns one task, or `undefined`.
- `save(task)` adds a task, or replaces the stored one with the same id.
- `delete(id)` removes a task and returns `false` when there was none.

What follows from this:

- **Data does not survive a restart.**
- **It works for one API process only.** Two copies of the API would each have their own list.
- **Memory is the only limit on size,** which is one reason the API is rate limited.

To move to a real database, only the repository changes: its four methods would call SQLite (through Prisma or TypeORM) and become `async`, and the service would `await` them. The controller, the DTOs, the validation and the web app would stay as they are.

## Decisions

1. **In-memory storage, behind a repository class.** The brief allows either option. With no database there is no setup step that can fail on the reviewer's machine. The cost is that data does not survive a restart. `TasksRepository` is the only class that knows how tasks are stored, so moving to SQLite later means rewriting its four methods and nothing else.

2. **The API decides what is valid; the form repeats the rules for speed.** DTOs with class-validator run in one global `ValidationPipe`. It has `whitelist` and `forbidNonWhitelisted` on, so a client cannot send fields such as `id` or `createdAt`. The web form has the same limits in a zod schema, only so the user sees a message under the field without waiting for a request. `UpdateTaskDto` is written out by hand instead of using `PartialType(CreateTaskDto)`: `PartialType` makes every field `@IsOptional()`, which also accepts `null`, and that would let `{"title": null}` through.

3. **API errors are shown where the action happened, and never cost the user their input.** `web/src/lib/api-client.ts` turns every failure into one `ApiError` type. That covers an error response from the API (whose `message` can be a string or an array) and no response at all. A failed save keeps the dialog open with the typed values and the API's message above the fields. Closing the form with unsaved changes asks for confirmation first. A failed load shows the message with a "Try again" button. If a refresh fails after tasks were already loaded, the tasks stay on screen under the message. Success is a toast.

4. **`dueDate` is a date-only string (`YYYY-MM-DD`), not a timestamp.** A due date is a calendar day. Stored as a timestamp, "4 December" turns into "3 December" for anyone whose time zone is behind UTC. The API rejects timestamps and impossible dates such as `2026-02-30`, and the web app builds dates from the parts so they are read as local time.

5. **TanStack Query holds server data, and the list is reloaded after every change.** It supplies the loading, error and retry states the brief asks for. After a create, update or delete (successful or not) the list is fetched again, so the table always shows what the server has. That costs one extra request per action, which is the right trade for an app this size. The one exception is changing a status from the table: that click has no "Saving…" state to wait in, so the badge changes at once (an optimistic update) and goes back, with an error toast, if the API refuses.

Smaller choices: any unknown id answers `404`, including ids that are not UUIDs, because the brief says "404 when a task does not exist". `configureApp()` holds the pipe, security headers and CORS settings so that `main.ts` and the e2e tests use exactly the same setup.

## Security

What is in place:

- **Input.** The API accepts only the fields its DTOs declare and rejects everything else with `400`. Lengths are capped.
- **Rate limit.** 100 calls per minute per endpoint and IP address (`@nestjs/throttler`). Without it, a script could fill the in-memory store until the process runs out of memory.
- **CORS.** Browsers may call the API only from the origins in `WEB_ORIGIN`.
- **Response headers.** `helmet` on the API. On the web app, `web/next.config.ts` sets a Content Security Policy that limits scripts, frames and outgoing connections to the app itself and the API, plus `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy` and `Permissions-Policy`.
- **Output.** React escapes everything it renders, and the app never uses `dangerouslySetInnerHTML`.
- **Dependencies.** `npm audit` reports 0 vulnerabilities in both folders (checked 25 November 2026).
- **Secrets.** There are none. `.env` files are ignored by git, and the only `NEXT_PUBLIC_` value is the API's address.

What is not there, on purpose:

- **No login.** The brief does not ask for users, so anyone who can reach the API can read and change every task. This is fine on `localhost` and would have to change before the app went anywhere public.
- **No HTTPS or HSTS.** Both apps run over plain HTTP locally. TLS belongs to wherever the app is deployed.
- **The CSP allows inline scripts** (`'unsafe-inline'`), because Next.js needs them unless every request gets a nonce, which would stop the page being served as static HTML.

## How I used AI

**Tool.** Claude Code (Anthropic's coding agent, model Claude Fable 5.2), in VS Code. It was used for all of Section 1 and for nothing in Section 2.

**How it was used.** I gave it the assignment brief. It wrote a plan first (storage, libraries, file layout, how to verify), and I approved the plan before any code existed. It then scaffolded both projects with the official CLIs, wrote the code, the tests and this README, and checked its work by running the tests, calling every endpoint with `curl`, and using the web app in a real browser. Its commits carry a `Co-Authored-By: Claude` line.

**What was changed in the generated code.**

Code produced by the CLIs (`nest new`, `create-next-app`, `shadcn`) was changed in these places:

- `nest new` now wires in a hosted monitoring service (`@nestjs/observe`), a deploy tool and agent instruction files. All removed: the brief does not ask for them, and the monitoring module wants an account key.
- shadcn's theme set `--font-sans: var(--font-sans)`, which points at itself unless the layout defines that variable. The scaffolded layout defined `--font-geist-sans` instead, which left `--font-sans` undefined. `web/src/app/layout.tsx` now defines `--font-sans`.
- shadcn's toast component read the theme from `next-themes`, which the app does not use. It now follows the operating system setting, like the rest of the page, and the package was removed.
- `create-next-app`'s `.gitignore` ignores `.env*`, which would have left `web/.env.example` out of the repository. An exception was added.
- Dark styles were switched from a `.dark` class to `prefers-color-scheme`, since there is no theme toggle.

> **TODO before submitting:** replace this note with the changes you made yourself after reading the code. The brief asks what *you* changed, and only you can say.

**Mistakes the AI made, and how each was noticed.**

1. **A failed refresh made the task table disappear.** The first version of `tasks-view.tsx` showed either the table or the error. When a background refresh failed, TanStack Query set the error state while still holding the loaded tasks, and the page swapped the table for the error message. Noticed in the browser test: with the page open, the API was stopped and a save attempted, and the table vanished behind the dialog. Fixed in commit `029a173`. To see it: `git show 029a173`.

2. **The plan would have accepted `{"title": null}` on `PATCH`.** The approved plan said `PartialType(CreateTaskDto)`. `PartialType` adds `@IsOptional()`, which skips all other rules for `null`. Noticed before the DTO was written, from the NestJS 12 validation notes, and locked in with the e2e test "answers 400 when title is null". The DTO is written out by hand instead (commit `f798f8d`).

3. **The "not found" error showed a raw id to the user.** The API message was `Task "6983f5d3-…" was not found`, and the web app displays API messages as they are. Noticed in the browser by editing a task that had just been deleted with `curl`. The message is now `Task not found. It may have been deleted.` (commit `c494ac0`).

4. **The phone layout was cramped.** At 375px wide the title column was about 100px, so titles wrapped onto many lines. Noticed in a screenshot at that width. Status now moves under the title on small screens (commit `0e3e984`).

5. **A commit message had the co-author line twice.** A shell quoting slip in the AI's `git commit` command. Noticed by reading `git log` straight after, and corrected before anything was pushed.

6. **The first Content Security Policy blocked a local development tool.** It allowed connections only to the app and the API, so the browser refused the websocket an editor extension (Console Ninja) opens to `127.0.0.1` and filled the console with errors. Noticed in the browser console on the first load after adding the policy. Local websockets are now allowed in development only; the production policy is unchanged.

7. **Closing a dialog dropped keyboard focus.** The dialogs are opened from code, so the dialog library had no trigger button to give focus back to, and after any close (even Cancel) the next Tab started from the top of the page. Noticed while testing a narrower fix for focus after a delete: the test showed focus on `<body>` after pressing Escape. Fixed with one small hook, `web/src/hooks/use-return-focus.ts`, used by both dialogs.

All seven were caught by the AI's own checks during the build, not by me afterwards.

After the first version I asked for follow-ups, which the AI also built: changing a task's status straight from the table (with the status filter), a security pass (rate limit and response headers), a warning before unsaved form changes are discarded, and a tab icon.

> **TODO before submitting:** add at least one thing you noticed yourself while reviewing, and how you noticed it.
