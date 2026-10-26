# ChatGPT Clone

A simple responsive chat app with:
- React frontend
- Express backend
- Gemini API integration

## Setup

1. Install dependencies from the project folder:
   - `npm install`
   - `npm install --prefix client`
2. Add the provider keys you want to use to `server/.env`:
   - `GEMINI_API_KEY=your_gemini_api_key_here`
   - `GEMINI_TEXT_MODEL=gemini-2.0-flash`
   - `OPENAI_API_KEY=your_openai_api_key_here` (optional image-generation fallback)
   - `POLLINATIONS_API_KEY=your_pollinations_secret_key_here` (recommended authenticated image-generation fallback)
   Never put API keys in the React client or commit them to Git.
3. Start the backend and frontend together:
   - `npm run dev`

The frontend runs at http://localhost:3000 and the backend at http://localhost:5000. Project generation and chat require the backend and a valid Gemini API key. Text-to-image requests try configured Gemini and OpenAI providers first, then use the authenticated Pollinations image API when `POLLINATIONS_API_KEY` is set. Without that key, they use Pollinations' public endpoint, which is subject to per-IP rate limits. Create a secret key at https://enter.pollinations.ai/keys, store it only in `server/.env`, and restart the backend. Uploaded-image edits still require available quota from a configured Gemini or OpenAI image provider. The chat automatically adds live Jaipur weather data when a message asks about weather, temperature, forecast, or मौसम.

Set `GEMINI_IMAGE_MODEL` or `OPENAI_IMAGE_MODEL` in `server/.env` to select models available to your keys.
