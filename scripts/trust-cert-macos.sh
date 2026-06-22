#!/usr/bin/env sh
set -eu

CERT_DIR="$(cd "$(dirname "$0")/.." && pwd)/certs"
CA_CERT="$CERT_DIR/ca-cert.pem"
CLIENT_P12="$CERT_DIR/client.p12"
CLIENT_P12_PASS="changeit"

if [ ! -f "$CA_CERT" ]; then
  echo "ERROR: CA cert not found at $CA_CERT"
  echo "Run: npm run generate:cert"
  exit 1
fi

if [ ! -f "$CLIENT_P12" ]; then
  echo "ERROR: Client p12 not found at $CLIENT_P12"
  echo "Run: npm run generate:cert"
  exit 1
fi

echo "Trusting local CA certificate in your login keychain..."
security add-trusted-cert -r trustRoot -k ~/Library/Keychains/login.keychain-db "$CA_CERT"

echo "Importing client identity (cert + private key) into your login keychain..."
security import "$CLIENT_P12" -k ~/Library/Keychains/login.keychain-db -P "$CLIENT_P12_PASS" -T /usr/bin/curl -T "/Applications/Google Chrome.app" -A

echo ""
echo "Verifying the client identity is valid..."
security find-identity -v ~/Library/Keychains/login.keychain-db | grep -i "local-auth-client" \
  && echo "Client identity is ready." \
  || echo "WARNING: identity not listed as valid — re-run npm run generate:cert then this script."

echo ""
echo "Done."
echo ""
echo "Next steps:"
echo "  1. FULLY quit your browser (Cmd+Q), not just close the tab."
echo "  2. Reopen the browser and go to https://localhost:3443/challenge/certificate"
echo "  3. When prompted, select the 'local-auth-client' certificate."
echo "  4. The certificate challenge will be validated."
echo ""
echo "Tip: If Firefox is used, manually import certs/client.p12 in:"
echo "  Preferences → Privacy & Security → Certificates → View Certificates → Import"

