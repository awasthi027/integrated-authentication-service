const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const { app } = require("../app");

function request({ port, authHeader, path = "/" }) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port,
        path,
        method: "GET",
        headers: authHeader ? { Authorization: authHeader } : {}
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => {
          body += chunk;
        });
        res.on("end", () => {
          resolve({ statusCode: res.statusCode, headers: res.headers, body });
        });
      }
    );

    req.on("error", reject);
    req.end();
  });
}

test("requires credentials", async () => {
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const response = await request({ port, path: "/challenge/basic" });
    assert.equal(response.statusCode, 401);
    assert.match(response.headers["www-authenticate"], /Basic/);
  } finally {
    server.close();
  }
});

test("loads page with valid credentials", async () => {
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const auth = Buffer.from("admin:password123").toString("base64");
    const response = await request({
      port,
      path: "/challenge/basic",
      authHeader: `Basic ${auth}`
    });

    assert.equal(response.statusCode, 200);
    assert.match(response.body, /Username and Password Challenge Validated/);
    assert.match(
      response.body,
      /This page is shown only when the correct username and password are provided\./
    );
  } finally {
    server.close();
  }
});

test("root lists separate authentication endpoints", async () => {
  const server = app.listen(0);
  const port = server.address().port;

  try {
    const response = await request({ port, path: "/" });
    assert.equal(response.statusCode, 200);
    assert.match(response.body, /\/challenge\/basic/);
    assert.match(response.body, /\/challenge\/certificate/);
  } finally {
    server.close();
  }
});


