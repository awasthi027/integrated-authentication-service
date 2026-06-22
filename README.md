# integrated-authentication-service

Simple Node.js service that prompts the browser for username and password (HTTP Basic Auth) before loading the page content.

## Default credentials

- Username: `admin`
- Password: `password123`

You can override these values using environment variables:

- `BASIC_AUTH_USER`
- `BASIC_AUTH_PASS`

## Run locally

```bash
npm install
npm start
```

`npm start` behavior:

- Local development: starts HTTPS on `https://localhost:3443` and requires local cert files.
- Railway/production (`NODE_ENV=production`): starts HTTP on `PORT` because TLS is terminated by the platform.

If local certificates are missing, startup fails with a message to run `npm run generate:cert`.

Open the landing page to see available authentication endpoints:

- `/challenge/basic` - username/password challenge (HTTP Basic Auth)
- `/challenge/certificate` - certificate challenge (requires HTTPS)

## Enable self-signed HTTPS for `npm start`

Generate local server/client certificates:

```bash
npm run generate:cert
```

Then run:

```bash
npm start
```

Use these endpoints on HTTPS (after cert generation):

- `https://localhost:3443/challenge/basic`
- `https://localhost:3443/challenge/certificate`

- Your browser will show a security warning because the certificate is self-signed.
- Continue to the page.
- For certificate challenge, import `certs/client.p12` into the browser/client certificate store (password: `changeit`).
- After certificate selection, the page confirms the certificate challenge was validated only when the presented certificate is both trusted by the local CA and marked for TLS client authentication.
- For basic challenge, the browser prompts for username and password.

Minimal files used after generation:

- `certs/client.p12` for browser client-certificate authentication
- `certs/server-key.pem`, `certs/server-cert.pem`, and `certs/ca-cert.pem` for `npm start` HTTPS server

You can override file paths if needed:

- `SSL_KEY_PATH`
- `SSL_CERT_PATH`
- `SSL_CA_PATH`
- `HTTPS_PORT`


## Deploy on Railway

This repository includes `railway.json` with an explicit start command (`npm start`).

`npm start` detects Railway runtime and starts HTTP on Railway's `PORT` automatically.
Do not generate local self-signed certs inside Railway containers.

Note: `/challenge/certificate` requires direct TLS handshake to this app. On Railway,
TLS is terminated at the platform edge, so browser client-certificate challenge is not available.

After connecting the repo in Railway, set these environment variables in the Railway service:

- `BASIC_AUTH_USER`
- `BASIC_AUTH_PASS`

Railway provides `PORT` automatically.

## Run tests

```bash
npm test
```
