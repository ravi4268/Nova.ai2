# ChatGPT Clone

A simple responsive chat app with:
- React frontend
- Express backend
- Gemini API integration

## Setup

1. Install dependencies from the project folder:
   - `npm install`
   - `npm install --prefix client`
2. Add a Gemini API key to `server/.env`:
   - `GEMINI_API_KEY=your_gemini_api_key_here`
   - `GEMINI_TEXT_MODEL=gemini-2.0-flash`
   Never put this key in the React client or commit it to Git.
3. Start the backend and frontend together:
   - `npm run dev`

The frontend runs at http://localhost:3000 and the backend at http://localhost:5000. Project generation requires the backend and a valid Gemini API key. The chat automatically adds live Jaipur weather data when a message asks about weather, temperature, forecast, or मौसम.
