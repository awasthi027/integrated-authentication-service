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

## Run tests

```bash
npm test
```
