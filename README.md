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