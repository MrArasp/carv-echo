-- Enable pgcrypto extension for digest() function used by hash_wallet_address()
CREATE EXTENSION IF NOT EXISTS pgcrypto;