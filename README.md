# Mission 4 – Insurance Policy Chatbot

An AI chatbot that asks the user a few questions about their vehicle and needs, then recommends the most suitable insurance policy. It's built with a React frontend and an Express backend that uses Google Gemini.

## Tech stack

- **Frontend:** React (Vite), a single page with a chat widget
- **Backend:** Node.js, Express
- **AI:** Google Gemini via `@google/genai`
- **Tests:** Playwright (browser tests for the chat widget)
- **Lint:** oxlint, run on every commit by Husky and lint-staged
- **Docker:** one container for the backend, one for the frontend
- **CI:** GitHub Actions

## Project structure

```text
Mission-4/
├── .github/workflows/ci.yml   # CI: lint, tests and Docker build on every push and PR to main
├── .husky/pre-commit          # runs lint-staged before every commit
├── Backend/                   # Express API + Gemini (Tina)
│   ├── index.js
│   ├── Dockerfile
│   ├── .env                   # not committed
│   └── package.json
├── Frontend/                  # React frontend (Vite)
│   ├── src/
│   │   ├── App.jsx
│   │   └── components/        # ChatWindow, ChatInput, MessageBubble
│   ├── Dockerfile
│   ├── .oxlintrc.json         # React lint rules
│   └── package.json
├── tests/
│   └── test-tina.spec.js      # Playwright tests
├── docker-compose.yml
├── playwright.config.js
├── .lintstagedrc.json         # which linter runs on staged files
├── package.json               # Playwright, Husky, lint-staged, oxlint
└── README.md
```

## Prerequisites

- Node.js 24 (the same version as the Dockerfiles and CI). Run `node -v` to check.
- A Google Gemini API key from Google AI Studio.
- Docker Desktop, only if you want to run the app in containers.

## Getting started

### 1. Clone the repo

```bash
git clone https://github.com/saritajoryder62-design/Mission-4.git
cd Mission-4
npm install
```

`npm install` in the root folder installs Playwright and the lint tools. It also switches on the pre-commit hook.

### 2. Set up the backend

```bash
cd Backend
npm install
```

Create a `.env` file in `Backend/`:

```text
GEMINI_API_KEY=your_api_key_here
```

Start the backend:

```bash
npm run dev
```

The backend runs at `http://localhost:5000`. The Vite dev server passes the frontend's `/api` requests on to this port, so don't set a different `PORT` in `.env`.

### 3. Set up the frontend

Open a second terminal:

```bash
cd Frontend
npm install
npm run dev
```

The app runs at `http://localhost:5173`.

## Running the tests

The Playwright tests need the frontend running on port 5173. They don't need the backend, because every test fakes the `/api/chat` reply, so the tests never call Gemini.

From the root folder:

```bash
npx playwright install chromium firefox   # first time only: downloads the test browsers
npx playwright test                       # runs every test in Chromium and Firefox
npx playwright show-report                # opens the HTML report
```

| Test | What it checks |
| --- | --- |
| Pop-up bubble | The opt-in question pops up by itself after a few seconds |
| Opening the chat | Clicking the chat icon shows the opt-in question inside the panel |
| Send a message | The user's message and Tina's reply both appear |
| Backend error | A 500 error shows "Tina is having trouble right now. Please try again." |
| Error that isn't JSON | The same friendly message shows, not a raw JSON error |
| Backend down | A 502 from the Vite proxy shows "I can't reach the server right now. Please try again in a moment." |
| Escape key | Pressing Escape closes the chat panel |

The backend has no automated tests yet.

## Lint checks

Check the whole project (Frontend, Backend and tests) from the root folder:

```bash
npm run lint
```

Every `git commit` also runs `oxlint --fix --deny-warnings` on the staged JavaScript files:

- Problems oxlint can fix are fixed and added to the commit.
- Any error or warning that is left stops the commit and shows the file and line.
- In VS Code, a stopped commit shows "pre-commit script failed". Click "Show Command Output" to see the problem.

Fix the problem and commit again. Don't skip the check with `--no-verify`. CI runs the same lint check on every push and pull request, so a skipped check still gets caught.

## Run it with Docker

Start Docker Desktop first, then from the root folder:

```bash
docker compose up --build   # build the images and start both containers
docker compose down         # stop and remove the containers (the images are kept)
```

The app runs at `http://localhost:5173`. The browser only talks to the frontend container. Vite passes `/api` requests on to the backend container at `http://backend:5000`, set by `API_TARGET` in `docker-compose.yml`.

## CI

`.github/workflows/ci.yml` runs on every push and pull request to `main`. You can also start it by hand from the Actions tab.

| Job | What it does |
| --- | --- |
| Lint | Runs `npm run lint -- --deny-warnings` over the whole project, the same check as the pre-commit hook |
| Backend tests | Runs `npm test` in `Backend/`. There are no backend tests yet, so this job runs nothing. |
| Playwright tests | Starts the frontend and runs the Playwright tests in Chromium |
| Docker build | Builds both images, only after lint and both test jobs pass |

## Dependencies

### Backend

| Package | Purpose |
| --- | --- |
| express | API server and routes |
| dotenv | Loads environment variables from `.env` |
| @google/genai | Google Gemini SDK |
| nodemon (dev) | Auto-restarts the server on save |

### Frontend

| Package | Purpose |
| --- | --- |
| react / react-dom | UI library (installed by Vite) |
| vite, @vitejs/plugin-react (dev) | Dev server and build tool |
| oxlint (dev) | Lint rules for the React code |

### Root

| Package | Purpose |
| --- | --- |
| @playwright/test (dev) | Browser tests |
| husky (dev) | Runs the pre-commit hook |
| lint-staged (dev) | Runs the linter on staged files only |
| oxlint (dev) | Linter for the whole project |

## Progress log

<!-- Each day reuses the same sub-headings, so only flag duplicates under the same day. -->
<!-- markdownlint-configure-file { "MD024": { "siblings_only": true } } -->

### Day 2 – Docker setup (13 November 2026)

#### What I did

- Added a `Dockerfile` to `Backend/`. It uses Node 24 on Alpine Linux, installs only the production packages (`npm ci --omit=dev`) and starts the server with `node index.js` on port 3000.
- Added a `Dockerfile` to `Frontend/`. It uses Node 24 on Alpine Linux and runs the Vite dev server on port 5173. The `--host` flag lets the browser reach Vite from outside the container.
- Added a `.dockerignore` to each folder, so `node_modules`, `.env` and `dist` are not copied into the images.
- Added `docker-compose.yml` to the project root. It builds and runs both containers. The backend gets `GEMINI_API_KEY` from `Backend/.env` through `env_file`, so the key is never stored inside an image.
- Made VS Code snippets (`compose-app`, `docker-backend`, `docker-frontend`) to fill in the boilerplate for these files. They live in my VS Code settings, not in this repo.

#### Problem I hit

The first `docker compose up` failed with `invalid environment variable: =GEMINI_API_KEY`. My `Backend/.env` had the variable name with no value. Docker needs every line in the form `NAME=value`, with no spaces around `=` and no quotes:

```text
GEMINI_API_KEY=your_api_key_here
```

#### How I tested it

| Test | Result |
| --- | --- |
| `docker compose up --build` builds both images | Passed |
| Both containers start (`mission-4-backend-1` and `mission-4-frontend-1`) | Passed |
| `http://localhost:3000` returns "Backend is running" | Passed |
| `http://localhost:5173` loads the React page | Passed |
| `.env` is not inside the backend image | Passed |
| `GEMINI_API_KEY` reaches the running backend container | Passed |

#### Decisions

- The insurance policy PDFs in `Backend/docs/` are left out of git and out of the Docker image for now. This mission doesn't need them yet.
- Removed the empty `utils` folders. A `utils` folder will come back near the end of the mission, for a function that turns the recommended policy into a PDF.

### Tina chatbot, tests, CI and lint checks (17 November 2026)

#### What I did

- **Backend (PR #3):** added `POST /api/chat` to `Backend/index.js`. It sends the chat history to Gemini with Tina's instructions. Tina asks the opt-in question first, then one question at a time: the vehicle first, then the main driver. She follows the business rules: no Mechanical Breakdown Insurance for trucks or racing cars, and Comprehensive only for vehicles under 10 years old. If Gemini fails, the route returns status 500 with "Tina is having trouble right now. Please try again."
- **Frontend (PR #4, PR #6):** built the chat UI with speech-to-text in NZ English. The microphone button only shows in browsers that support speech recognition (Chrome, Edge and Safari). The chat is now a widget in the bottom-right corner. A pop-up bubble shows Tina's opt-in question after 3 seconds, and Escape closes the chat. The text box has a label for screen readers and tests.
- **Playwright tests (PR #5, PR #6):** six browser tests in `tests/test-tina.spec.js`. Every test fakes the backend reply.
- **CI (PR #6):** replaced the starter Playwright workflow with `.github/workflows/ci.yml`: backend tests, Playwright tests in Chromium, then a Docker build.
- **Lint checks (`Feature/Husky-lint` branch):** added Husky and lint-staged to the root `package.json`. Every commit runs oxlint on the staged files. `npm run lint` in the root folder checks the whole project. Files in `Frontend/` also get the React rules from `Frontend/.oxlintrc.json`.
- **API proxy (`Fix/api-proxy` branch):** the frontend now calls the relative URL `/api/chat` instead of `http://localhost:5000/api/chat`. The Vite dev server passes `/api` requests on to the backend: `localhost:5000` on my computer, and the backend container in Docker (`API_TARGET` in `docker-compose.yml`). When the backend is down, Vite answers 502, and the chat shows "I can't reach the server right now." I added a seventh Playwright test for this.
- **Code review clean-up (`Fix/api-proxy` branch):** removed an unused `Frontend/nginx.conf`. `.gitignore` and both `.dockerignore` files now cover every `.env` file (`.env*`), not only `.env`.

#### Problems I hit

- **CI failed on `npm ci` in `Backend/`:** `lock file's @google/genai@3.2.0 does not satisfy @google/genai@1.52.0`. `package.json` and `package-lock.json` didn't match. I changed `package.json` to match the lock file, and CI passed.
- **WebKit (Safari) tests failed with `spawn UNKNOWN` on my Windows machine.** I turned the WebKit project off in `playwright.config.js`. The tests run in Chromium and Firefox.
- **Docker ports don't match:** the backend listens on port 5000, and the frontend calls port 5000, but `docker-compose.yml` maps port 3000. Pull request #7 (`Fix/docker-ports`) changes the Dockerfile and the compose file to port 5000. The API proxy fixes the chat in Docker on its own, because the browser no longer calls port 5000 directly.

#### How I tested it

| Test | Result |
| --- | --- |
| CI on `main` after merging PR #6 (Playwright tests in Chromium, Docker build) | Passed |
| CI on PR #7 (`Fix/docker-ports`) | Passed |
| Pre-commit check stops a file with a syntax error | Passed |
| Pre-commit check stops a Backend file with an unused variable | Passed |
| Pre-commit check stops a Frontend file that calls a React hook inside an `if` | Passed |
| Pre-commit check lets a clean file through | Passed |
| `npm run lint` over the whole project | Passed, 0 problems |
| All 7 Playwright tests in Chromium and Firefox (14 runs), with the relative `/api/chat` URL | Passed |
| Vite proxy sends `/api/chat` to `localhost:5000` (fake backend) | Passed |
| Vite proxy sends `/api/chat` to the `API_TARGET` address (fake backend) | Passed |
| Vite proxy answers 502 when the backend is down | Passed |
| Docker: `/api/chat` on the frontend container reaches the backend container | Passed |
| Docker: no `.env` file inside either image | Passed |

#### Decisions

- **The tests fake the backend.** They are fast, free and give the same result every time, and they never use the Gemini API key.
- **The pre-commit hook runs lint only, not tests.** The Playwright tests need the frontend running and take longer, so they run in CI.
- **`--deny-warnings`:** without it, oxlint warnings (such as an unused variable) don't stop a commit.
- **Gemini model `gemini-3.5-flash-lite`:** it replies in about 1 second. `gemini-3.5-flash` took 30 to 40 seconds.

#### Still to do

- Add backend tests for `/api/chat`, with Gemini faked. The "Backend tests" job in CI passes now, but it runs no tests.
- Check Tina's business rules by hand, because Gemini's replies change each time. For example, a truck owner should not be offered Mechanical Breakdown Insurance.
- Run the lint check in CI too.
- Merge pull request #7, so the backend's port mapping matches the port it listens on (5000).
