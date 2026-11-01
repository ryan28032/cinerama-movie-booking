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

## Nearby cinemas and showtimes

The **Find a cinema** section includes a city picker for major Indian cities plus London and New York. It searches mapped cinema venues within 25 km of the selected city center using OpenStreetMap's public Overpass service; browser location is optional. Venue websites open directly; venue location coverage depends on community map data.

Live indie and repertory showtimes come from the [Open Cinema Project API](https://opencinemaproject.com/developers). Request a free API key from its developer page, paste it into the visible showtime field, choose a city, and load showtimes. The key stays in the current tab and is sent to that API; it is not saved to this app or its repository. Coverage depends on participating cinemas. Ticket purchase and real seat availability remain with the cinema's checkout. The poster titles elsewhere on the page are clearly labeled sample content; they are not current movie listings.

## Theme

The site follows the device's light/dark preference on first visit. Use the sun/moon control in the header to switch themes; the selection is saved in the current browser.
