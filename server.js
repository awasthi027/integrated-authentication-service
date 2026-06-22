const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const https = require("node:https");
const { app } = require("./app");

const HTTP_PORT = process.env.PORT || 3000;
const HTTPS_PORT = process.env.HTTPS_PORT || 3443;
const keyPath = process.env.SSL_KEY_PATH || path.join(__dirname, "certs", "server-key.pem");
const certPath = process.env.SSL_CERT_PATH || path.join(__dirname, "certs", "server-cert.pem");
const caPath = process.env.SSL_CA_PATH || path.join(__dirname, "certs", "ca-cert.pem");

function attachServerErrorHandler(server, protocol, port) {
  server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      console.error(`Port ${port} is already in use. Stop the other process or change the port.`);
      process.exit(1);
    }

    console.error(`${protocol} server failed to start.`, error);
    process.exit(1);
  });
}

function hasHttpsFiles() {
  return fs.existsSync(keyPath) && fs.existsSync(certPath) && fs.existsSync(caPath);
}

function startHttpServer() {
  const server = http.createServer(app);

  attachServerErrorHandler(server, "HTTP", HTTP_PORT);

  server.listen(HTTP_PORT, () => {
    console.log(`HTTP server running on port ${HTTP_PORT}`);
  });
}

function startHttpsServer() {
  const server = https.createServer(
    {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
      ca: fs.readFileSync(caPath),
      requestCert: true,
      rejectUnauthorized: false
    },
    app
  );

  attachServerErrorHandler(server, "HTTPS", HTTPS_PORT);

  server.listen(HTTPS_PORT, () => {
    console.log(`HTTPS server running at https://localhost:${HTTPS_PORT}`);
  });
}

const isRailwayRuntime = Boolean(process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_STATIC_URL);
const isProductionRuntime = process.env.NODE_ENV === "production" || isRailwayRuntime;

if (isProductionRuntime) {
  // Railway and other managed platforms terminate TLS at the edge/proxy.
  startHttpServer();
} else if (!hasHttpsFiles()) {
  console.error("HTTPS certificates are required for npm start.");
  console.error("Generate them with: npm run generate:cert");
  process.exit(1);
} else {
  startHttpsServer();
}

