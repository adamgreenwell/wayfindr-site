# Wayfindr Static Site

Placeholder public site for `wayfindr.cc`.

## Local Development

```bash
npm install
npm test
npm run dev
```

## Production Build

```bash
npm test
npm run build
```

The static output is written to `dist/`.

## Wayfindr Dogfood Widget

The public site can dogfood the deployed Wayfindr widget without hard-coding
production details into the repo. Copy `.env.example` to `.env.local` for local
testing, or set the same variables in Sevalla.

Required:

- `VITE_WAYFINDR_API_BASE_URL`: deployed Wayfindr app URL, for example `https://wayfindr.on-forge.com`
- `VITE_WAYFINDR_SITE_PUBLIC_KEY`: dedicated public key for the `wayfindr.cc` Site record

Optional:

- `VITE_WAYFINDR_LAUNCHER_LABEL`
- `VITE_WAYFINDR_TITLE`
- `VITE_WAYFINDR_REVERB_APP_KEY`
- `VITE_WAYFINDR_REVERB_HOST`
- `VITE_WAYFINDR_REVERB_PORT`
- `VITE_WAYFINDR_REVERB_SCHEME`

If the site public key is omitted, the widget loader stays inert. Keep this site
on stable Wayfindr deployments; use the Sevalla smoke site for rough branch
testing. Reverb values are only useful once `pusher-js` is also available to the
page; without them, the widget still works with its manual refresh fallback.

## Sevalla Static Site Settings

- Root directory: `.`
- Build command: `npm ci && npm run build`
- Publish directory: `dist`
- Domain: `wayfindr.cc`
- Environment variables: set the Wayfindr dogfood values above when PR #21 or
  newer is deployed on the Wayfindr app
