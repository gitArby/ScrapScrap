#!/bin/bash
set -e

if [ ! -f .env ]; then
    echo "Error: .env file not found. Copy .env.example to .env and fill in your values."
    exit 1
fi

source .env

# XOR key for obfuscation — change this to any random string
XOR_KEY="Sc4pSc4p_0bfu5c8"

# XOR-encode a string and output as hex
xor_encode() {
    local input="$1"
    local key="$XOR_KEY"
    local key_len=${#key}
    local result=""
    for (( i=0; i<${#input}; i++ )); do
        local char_code=$(printf '%d' "'${input:$i:1}")
        local key_code=$(printf '%d' "'${key:$((i % key_len)):1}")
        local xored=$(( char_code ^ key_code ))
        result+=$(printf '%02x' "$xored")
    done
    echo "$result"
}

ENC_API_KEY=$(xor_encode "$FIREBASE_API_KEY")
ENC_AUTH_DOMAIN=$(xor_encode "$FIREBASE_AUTH_DOMAIN")
ENC_PROJECT_ID=$(xor_encode "$FIREBASE_PROJECT_ID")
ENC_STORAGE_BUCKET=$(xor_encode "$FIREBASE_STORAGE_BUCKET")
ENC_MESSAGING_SENDER_ID=$(xor_encode "$FIREBASE_MESSAGING_SENDER_ID")
ENC_APP_ID=$(xor_encode "$FIREBASE_APP_ID")
ENC_SECRET=$(xor_encode "$ANTICHEAT_SECRET")

cat > config.js << EOF
G.config = {
    _k: "$(echo -n "$XOR_KEY" | base64)",
    _d: {
        a: "$ENC_API_KEY",
        b: "$ENC_AUTH_DOMAIN",
        c: "$ENC_PROJECT_ID",
        d: "$ENC_STORAGE_BUCKET",
        e: "$ENC_MESSAGING_SENDER_ID",
        f: "$ENC_APP_ID",
        g: "$ENC_SECRET"
    }
};
EOF

echo "config.js generated (obfuscated) from .env"
