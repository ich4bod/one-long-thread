# One Long Thread

Pull a knitted picture apart into one long, colored thread, then wind it back into cloth or dye a picture of your own.

See [BRIEF.md](BRIEF.md) for the project brief and model contract.

Run the model tests from the repository root:

```sh
node tests/model.mjs
```

All state lives in the browser and is disposable.

## Local checks

Serve `public/` with a static HTTP server to try the toy locally. The modules
require HTTP rather than opening `index.html` as a file. On this host, use the
container deployment below and test its internal address:

```sh
docker compose up -d --build
bash tests/browser.sh http://one-long-thread-web-1:3000/ 4
```

The browser suite runs in a disposable Playwright container and writes ignored
screenshots to `artifacts/`.

## Deployment

The Compose service uses the external `ichabod-proxy` network and Traefik's `web`
entrypoint, without publishing a host port. nginx serves only `public/` on port
3000, provides `/healthz`, and serves `.mjs` as JavaScript.

```sh
git push origin main
docker compose up -d --build
# Wait for the container to become healthy before requesting public assets.
verify-app one-long-thread
bash tests/browser.sh https://one-long-thread.ichabod-crane.net/ 4
```

Public URL: https://one-long-thread.ichabod-crane.net/
