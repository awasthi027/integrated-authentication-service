const test = require("node:test");
const assert = require("node:assert/strict");
const childProcess = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const https = require("node:https");
const { app } = require("../app");

const certDir = path.join(__dirname, "..", "certs");

function startHttpsTestServer() {
  const server = https.createServer(
    {
      key: fs.readFileSync(path.join(certDir, "server-key.pem")),
      cert: fs.readFileSync(path.join(certDir, "server-cert.pem")),
      ca: fs.readFileSync(path.join(certDir, "ca-cert.pem")),
      requestCert: true,
      rejectUnauthorized: false
    },
    app
  );

  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      resolve(server);
    });
  });
}

function requestCertificatePage({ port, pfx, passphrase }) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: "127.0.0.1",
        port,
        path: "/challenge/certificate",
        method: "GET",
        rejectUnauthorized: false,
        cert: pfx.cert,
        key: pfx.key,
        passphrase
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => {
          body += chunk;
        });
        res.on("end", () => {
          resolve({ statusCode: res.statusCode, body });
        });
      }
    );

    req.on("error", reject);
    req.end();
  });
}

function extractClientCertificatePem() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "ias-client-cert-"));
  const certPath = path.join(tempDir, "client-cert.pem");
  const keyPath = path.join(tempDir, "client-key.pem");
  const p12Path = path.join(certDir, "client.p12");

  childProcess.execFileSync("openssl", [
    "pkcs12",
    "-legacy",
    "-in",
    p12Path,
    "-passin",
    "pass:changeit",
    "-clcerts",
    "-nokeys",
    "-out",
    certPath
  ]);

  childProcess.execFileSync("openssl", [
    "pkcs12",
    "-legacy",
    "-in",
    p12Path,
    "-passin",
    "pass:changeit",
    "-nocerts",
    "-nodes",
    "-out",
    keyPath
  ]);

  return {
    cert: fs.readFileSync(certPath),
    key: fs.readFileSync(keyPath),
    cleanup() {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  };
}

test("certificate success page shows certificate name and capability", async () => {
  const server = await startHttpsTestServer();
  const port = server.address().port;
  const clientIdentity = extractClientCertificatePem();

  try {
    const response = await requestCertificatePage({
      port,
      pfx: clientIdentity,
      passphrase: "changeit"
    });

    assert.equal(response.statusCode, 200);
    assert.match(response.body, /Authenticated Certificate Details/);
    assert.match(response.body, /local-auth-client/);
    assert.match(response.body, /TLS Web Client Authentication/);
  } finally {
    clientIdentity.cleanup();
    await new Promise((resolve) => server.close(resolve));
  }
});

