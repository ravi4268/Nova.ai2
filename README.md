# ChatGPT Clone

A simple responsive chat app with:
- React frontend
- Express backend
- Gemini API integration

## Setup

1. Install dependencies:
   - `npm install`
   - `cd client && npm install`
2. Create a Gemini API key in Google AI Studio and add it to `server/.env`:
   - `GEMINI_API_KEY=your_gemini_api_key_here`
   - `GEMINI_MODEL=gemini-2.0-flash`
   Never put this key in the React client or commit it to Git.

The chat automatically adds live Jaipur weather data when a message asks about weather, temperature, forecast, or मौसम.
   - `PORT=5001`
3. Run the app:
   - `node server.js`
   - `cd client && npm start`

The frontend runs on http://localhost:3000 and the backend on http://localhost:5001.
