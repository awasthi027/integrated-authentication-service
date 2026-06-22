const express = require("express");
const fs = require("node:fs");
const path = require("node:path");
const { basicAuth } = require("./middleware/basicAuth");
const { certificateAuth } = require("./middleware/certificateAuth");

const app = express();
app.set("trust proxy", true);
const pagesDir = path.join(__dirname, "pages");
const certificateSuccessPagePath = path.join(pagesDir, "certificate-auth-success.html");
const certificateSuccessPageTemplate = fs.readFileSync(certificateSuccessPagePath, "utf8");

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderCertificateSuccessPage(details = {}) {
  const name = details.name || "Unknown certificate subject";
  const capabilities = Array.isArray(details.capabilities) && details.capabilities.length > 0
    ? details.capabilities
    : ["Unknown capability"];

  const capabilityItems = capabilities
    .map((capability) => `<li><code>${escapeHtml(capability)}</code></li>`)
    .join("");

  return certificateSuccessPageTemplate
    .replace("{{CERTIFICATE_NAME}}", escapeHtml(name))
    .replace("{{CERTIFICATE_CAPABILITIES}}", capabilityItems);
}


app.get("/", (req, res) => {
  res.sendFile(path.join(pagesDir, "authentication-home.html"));
});

app.get("/challenge/basic", basicAuth, (req, res) => {
  res.sendFile(path.join(pagesDir, "basic-auth-success.html"));
});


app.get("/challenge/certificate", certificateAuth, (req, res) => {
  res.type("html").send(renderCertificateSuccessPage(req.authenticatedCertificate));
});

module.exports = { app, renderCertificateSuccessPage };

