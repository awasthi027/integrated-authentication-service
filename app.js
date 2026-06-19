const express = require("express");

const app = express();

const AUTH_USER = process.env.BASIC_AUTH_USER || "admin";
const AUTH_PASS = process.env.BASIC_AUTH_PASS || "password123";

function challenge(res) {
  res.set("WWW-Authenticate", 'Basic realm="Integrated Authentication Test"');
  return res.status(401).send("Authentication required.");
}

function basicAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return challenge(res);
  }

  const encoded = authHeader.slice(6).trim();

  let decoded;
  try {
    decoded = Buffer.from(encoded, "base64").toString("utf8");
  } catch (error) {
    return challenge(res);
  }

  const separatorIndex = decoded.indexOf(":");
  if (separatorIndex === -1) {
    return challenge(res);
  }

  const username = decoded.slice(0, separatorIndex);
  const password = decoded.slice(separatorIndex + 1);

  if (username !== AUTH_USER || password !== AUTH_PASS) {
    return challenge(res);
  }

  return next();
}

app.get("/", basicAuth, (req, res) => {
  res.type("html").send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Integrated Authentication Page</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        margin: 2rem;
        color: #1f2937;
      }
      h1 {
        margin-bottom: 0.5rem;
      }
    </style>
  </head>
  <body>
    <h1>Integrated Authentication Test</h1>
    <p>This page is shown only when the correct username and password are provided.</p>
  </body>
</html>`);
});

module.exports = { app };

