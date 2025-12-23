-- Increase length of refresh_tokens.token to store full JWT values
ALTER TABLE "refresh_tokens"
ALTER COLUMN "token" TYPE TEXT;








