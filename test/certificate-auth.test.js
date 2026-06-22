const test = require("node:test");
const assert = require("node:assert/strict");
const { certificateAuth } = require("../middleware/certificateAuth");

function createRes() {
  return {
    statusCode: 200,
    body: "",
    typeValue: "",
    filePath: "",
    status(code) {
      this.statusCode = code;
      return this;
    },
    type(value) {
      this.typeValue = value;
      return this;
    },
    send(value) {
      this.body = value;
      return this;
    },
    sendFile(value) {
      this.filePath = value;
      return this;
    }
  };
}

test("certificateAuth rejects non-HTTPS requests", () => {
  const socket = { encrypted: false };
  socket.getPeerCertificate = () => ({});
  const req = {
    secure: false,
    socket,
    client: { authorized: false }
  };
  const res = createRes();
  let nextCalled = false;

  certificateAuth(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 400);
  assert.match(res.body, /requires HTTPS/);
});

test("certificateAuth reports unsupported behind TLS-terminating proxy", () => {
  const socket = { encrypted: false };
  socket.getPeerCertificate = () => ({});
  const req = {
    secure: true,
    socket,
    client: { authorized: false }
  };
  const res = createRes();
  let nextCalled = false;

  certificateAuth(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 501);
  assert.match(res.filePath, /certificate-not-available\.html$/);
});

test("certificateAuth challenges when no client certificate is presented", () => {
  const socket = { encrypted: true };
  socket.getPeerCertificate = () => ({});
  const req = {
    secure: true,
    socket,
    client: { authorized: false }
  };
  const res = createRes();
  let nextCalled = false;

  certificateAuth(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 401);
  assert.match(res.filePath, /certificate-auth-required\.html$/);
});

test("certificateAuth rejects untrusted client certificate", () => {
  const socket = { encrypted: true };
  socket.getPeerCertificate = () => ({
    subject: { CN: "client" },
    ext_key_usage: ["TLS Web Client Authentication"]
  });
  const req = {
    secure: true,
    socket,
    client: { authorized: false }
  };
  const res = createRes();
  let nextCalled = false;

  certificateAuth(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 403);
  assert.match(res.body, /not trusted/);
});

test("certificateAuth rejects trusted certificates without client-auth capability", () => {
  const socket = { encrypted: true };
  socket.getPeerCertificate = () => ({
    subject: { CN: "server-only-cert" },
    ext_key_usage: ["1.3.6.1.5.5.7.3.1"]
  });
  const req = {
    secure: true,
    socket,
    client: { authorized: true }
  };
  const res = createRes();
  let nextCalled = false;

  certificateAuth(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 403);
  assert.match(res.body, /not valid for TLS client authentication/);
});

test("certificateAuth allows trusted client certificate", () => {
  const socket = { encrypted: true };
  socket.getPeerCertificate = () => ({
    subject: { CN: "client" },
    ext_key_usage: ["1.3.6.1.5.5.7.3.2"]
  });
  const req = {
    secure: true,
    socket,
    client: { authorized: true }
  };
  const res = createRes();
  let nextCalled = false;

  certificateAuth(req, res, () => {
    nextCalled = true;
  });

  assert.equal(res.statusCode, 200);
  assert.equal(nextCalled, true);
  assert.deepEqual(req.authenticatedCertificate, {
    name: "client",
    capabilities: ["TLS Web Client Authentication"]
  });
});

