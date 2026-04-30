# TrainHarder Workout Tracker

A responsive React and Tailwind workout tracker prepared for Vercel. It includes a private login screen, exercise libraries for eight training styles, muscle-focused categories, video-ready exercise cards, local session tracking, and recent session history.

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` from `.env.example` and set the private credentials:

```bash
WORKOUT_AUTH_USERNAME=your-email@example.com
WORKOUT_AUTH_PASSWORD=your-password
WORKOUT_SESSION_SECRET=use-a-long-random-string
```

3. Run the app:

```bash
npm run dev
```

The Vite dev server includes a local `/api/login` middleware so authentication works without the Vercel CLI.

## Vercel Deployment

Use the default Vercel settings for a Vite project:

- Build command: `npm run build`
- Output directory: `dist`
- Framework preset: `Vite`

Add these environment variables in Vercel Project Settings:

- `WORKOUT_AUTH_USERNAME`
- `WORKOUT_AUTH_PASSWORD`
- `WORKOUT_SESSION_SECRET`

The production login endpoint lives in `api/login.js`.
