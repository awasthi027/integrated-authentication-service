const path = require("node:path");

const certificateRequiredPagePath = path.join(
  __dirname,
  "..",
  "pages",
  "certificate-auth-required.html"
);

const certificateNotAvailablePagePath = path.join(
  __dirname,
  "..",
  "pages",
  "certificate-not-available.html"
);

const CLIENT_AUTH_OID = "1.3.6.1.5.5.7.3.2";
const CLIENT_AUTH_LABEL = "TLS Web Client Authentication";

function getExtendedKeyUsage(certificate) {
  const values = [];

  if (Array.isArray(certificate?.ext_key_usage)) {
    values.push(...certificate.ext_key_usage);
  } else if (typeof certificate?.ext_key_usage === "string") {
    values.push(...certificate.ext_key_usage.split(/\s*,\s*/));
  }

  if (Array.isArray(certificate?.extendedKeyUsage)) {
    values.push(...certificate.extendedKeyUsage);
  } else if (typeof certificate?.extendedKeyUsage === "string") {
    values.push(...certificate.extendedKeyUsage.split(/\s*,\s*/));
  }

  return values.map((value) => String(value).trim()).filter(Boolean);
}

function supportsClientCertificateAuth(certificate) {
  return getExtendedKeyUsage(certificate).some((value) => {
    const normalized = value.toLowerCase();

    return (
      normalized === CLIENT_AUTH_OID ||
      normalized === "clientauth" ||
      normalized === CLIENT_AUTH_LABEL.toLowerCase()
    );
  });
}

function getCertificateCapabilities(certificate) {
  return [...new Set(getExtendedKeyUsage(certificate))].map((value) => {
    const normalized = value.toLowerCase();

    if (
      normalized === CLIENT_AUTH_OID ||
      normalized === "clientauth" ||
      normalized === CLIENT_AUTH_LABEL.toLowerCase()
    ) {
      return CLIENT_AUTH_LABEL;
    }

    return value;
  });
}

function getCertificateDisplayName(certificate) {
  return (
    certificate?.subject?.CN ||
    certificate?.subject?.commonName ||
    certificate?.subject?.O ||
    certificate?.subject?.OU ||
    certificate?.subjectaltname ||
    certificate?.fingerprint256 ||
    "Unknown certificate subject"
  );
}

function getPeerCertificate(req) {
  if (!req.socket || typeof req.socket.getPeerCertificate !== "function") {
    return null;
  }

  return req.socket.getPeerCertificate(true);
}

function certificateChallenge(res) {
  return res.status(401).sendFile(certificateRequiredPagePath);
}

function certificateAuth(req, res, next) {
  if (!req.secure) {
    return res.status(400).send("Certificate challenge endpoint requires HTTPS.");
  }

  if (!req.socket || !req.socket.encrypted) {
    return res.status(501).sendFile(certificateNotAvailablePagePath);
  }

  const certificate = getPeerCertificate(req);
  const hasCertificate = certificate && Object.keys(certificate).length > 0;

  if (!hasCertificate) {
    return certificateChallenge(res);
  }

  if (!req.client.authorized) {
    return res.status(403).send("Client certificate is not trusted by this server.");
  }

  if (!supportsClientCertificateAuth(certificate)) {
    return res
      .status(403)
      .send("Client certificate is not valid for TLS client authentication.");
  }

  req.authenticatedCertificate = {
    name: getCertificateDisplayName(certificate),
    capabilities: getCertificateCapabilities(certificate)
  };

  return next();
}

module.exports = { certificateAuth };

