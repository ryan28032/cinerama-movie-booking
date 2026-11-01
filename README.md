# Cinerama

A cinematic movie discovery and ticket booking demo built with React, TypeScript, Vite, Motion, and React Three Fiber.

## Run locally

Requires Node.js 22.12 or newer.

```sh
npm ci
npm run dev
```

Create a production build with `npm run build` and preview it with `npm run preview`.

## GitHub Pages

The `Build and deploy to GitHub Pages` workflow builds the app and publishes the `dist` folder whenever a commit reaches `main`. Enable GitHub Pages with **Settings → Pages → Build and deployment → GitHub Actions** if it is not enabled automatically by the workflow.

The booking flow is a front-end demo. Selected reservations are stored in the current browser's local storage; there is no shared booking database or payment processing.
