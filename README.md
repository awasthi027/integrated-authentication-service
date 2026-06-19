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

Open `http://localhost:3000` in a browser. The browser will show a login popup. The page title and description load only after valid credentials are entered.

## Deploy on Railway

This repository includes `railway.json` with an explicit start command (`npm start`).

After connecting the repo in Railway, set these environment variables in the Railway service:

- `BASIC_AUTH_USER`
- `BASIC_AUTH_PASS`

Railway provides `PORT` automatically.

## Run tests

```bash
npm test
```
