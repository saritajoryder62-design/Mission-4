# Mission-4Mission 4 – Insurance Policy Chatbot

An AI chatbot that asks the user a few questions about their vehicle and needs, then recommends the most suitable insurance policy. It's built with a React frontend and an Express backend that uses Google Gemini.

Tech Stack
Frontend: React (Vite), a single page
Backend: Node.js, Express
AI: Google Gemini via @google/genai
Project Structure
mission-4/
├── client/          # React frontend (Vite)
│   ├── src/
│   └── package.json
├── server/          # Express API + Gemini
│   ├── index.js
│   ├── .env         # not committed
│   └── package.json
├── .gitignore
└── README.md
Prerequisites
Node.js 18 or later (node -v to check)
A Google Gemini API key from Google AI Studio
Getting Started
1. Clone the repo
bash
git clone <https://github.com/saritajoryder62-design/Mission-4.git>
cd mission-4
1. Set up the server
bash
cd server
npm install

Create a .env file in server/:

GEMINI_API_KEY=your_api_key_here
PORT=3000

Start the server:

bash
npm run dev
3. Set up the client

Open a second terminal:

bash
cd frontend
npm install
npm run dev

The app runs at http://localhost:5173.

Dependencies
Server
Package	Purpose
express	API server and routes
cors	Allows the React app to call the API
dotenv	Loads environment variables from .env
@google/genai	Google Gemini SDK
nodemon (dev)	Auto-restarts the server on save
Client
Package	Purpose
react / react-dom	UI library (installed by Vite)

## Progress log

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

#### Run it with Docker

Start Docker Desktop first, then from the project root:

```bash
docker compose up --build   # build the images and start both containers
docker compose down         # stop and remove the containers (the images are kept)
```

#### Decisions

- The insurance policy PDFs in `Backend/docs/` are left out of git and out of the Docker image for now. This mission doesn't need them yet.
- Removed the empty `utils` folders. A `utils` folder will come back near the end of the mission, for a function that turns the recommended policy into a PDF.
