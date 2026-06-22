#!/usr/bin/env sh
set -eu

CERT_DIR="$(cd "$(dirname "$0")/.." && pwd)/certs"
CA_KEY="$CERT_DIR/ca-key.pem"
CA_CERT="$CERT_DIR/ca-cert.pem"
SERVER_KEY="$CERT_DIR/server-key.pem"
SERVER_CSR="$CERT_DIR/server.csr"
SERVER_CERT="$CERT_DIR/server-cert.pem"
CLIENT_KEY="$CERT_DIR/client-key.pem"
CLIENT_CSR="$CERT_DIR/client.csr"
CLIENT_CERT="$CERT_DIR/client-cert.pem"
CLIENT_P12="$CERT_DIR/client.p12"
CA_SERIAL="$CERT_DIR/ca.srl"
SERVER_CONF="$CERT_DIR/openssl-server.cnf"
CLIENT_CONF="$CERT_DIR/openssl-client.cnf"

mkdir -p "$CERT_DIR"

cat > "$SERVER_CONF" <<'EOF'
[req]
distinguished_name = req_distinguished_name
prompt = no

[req_distinguished_name]
CN = localhost

[v3_req]
subjectAltName = @alt_names
extendedKeyUsage = serverAuth

[alt_names]
DNS.1 = localhost
IP.1 = 127.0.0.1
EOF

cat > "$CLIENT_CONF" <<'EOF'
[req]
distinguished_name = req_distinguished_name
prompt = no

[req_distinguished_name]
CN = local-auth-client

[v3_req]
extendedKeyUsage = clientAuth
EOF

openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
  -keyout "$CA_KEY" \
  -out "$CA_CERT" \
  -subj "/CN=Local Dev Auth CA"

openssl req -new -nodes -newkey rsa:2048 \
  -keyout "$SERVER_KEY" \
  -out "$SERVER_CSR" \
  -config "$SERVER_CONF"

openssl x509 -req -days 825 \
  -in "$SERVER_CSR" \
  -CA "$CA_CERT" \
  -CAkey "$CA_KEY" \
  -CAserial "$CA_SERIAL" \
  -CAcreateserial \
  -out "$SERVER_CERT" \
  -extensions v3_req \
  -extfile "$SERVER_CONF"

openssl req -new -nodes -newkey rsa:2048 \
  -keyout "$CLIENT_KEY" \
  -out "$CLIENT_CSR" \
  -config "$CLIENT_CONF"

openssl x509 -req -days 825 \
  -in "$CLIENT_CSR" \
  -CA "$CA_CERT" \
  -CAkey "$CA_KEY" \
  -CAserial "$CA_SERIAL" \
  -out "$CLIENT_CERT" \
  -extensions v3_req \
  -extfile "$CLIENT_CONF"

# Export browser-importable certificate package for mTLS challenge.
# NOTE: OpenSSL 3.x defaults to AES-256-CBC + SHA256 MAC, which the macOS
# Keychain and Chrome cannot import. The -legacy flag (RC2-40 / 3DES / SHA1)
# produces a .p12 that macOS Keychain and Chrome can import successfully.
openssl pkcs12 -export -legacy \
  -inkey "$CLIENT_KEY" \
  -in "$CLIENT_CERT" \
  -certfile "$CA_CERT" \
  -name "local-auth-client" \
  -out "$CLIENT_P12" \
  -passout pass:changeit

rm -f \
  "$SERVER_CSR" \
  "$CLIENT_CSR" \
  "$SERVER_CONF" \
  "$CLIENT_CONF" \
  "$CA_KEY" \
  "$CLIENT_KEY" \
  "$CLIENT_CERT" \
  "$CA_SERIAL" \
  "$CERT_DIR/ca-cert.srl" \
  "$CERT_DIR/localhost-key.pem" \
  "$CERT_DIR/localhost-cert.pem"

echo "Self-signed certificate created:"
echo "  CA cert     : $CA_CERT"
echo "  Server key  : $SERVER_KEY"
echo "  Server cert : $SERVER_CERT"
echo "  Client p12  : $CLIENT_P12 (password: changeit)"

