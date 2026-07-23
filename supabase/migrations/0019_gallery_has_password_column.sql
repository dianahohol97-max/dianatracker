-- Step 1 of closing the password_hash leak: expose a safe boolean the public
-- gallery / API can read instead of the scrypt hash. The REVOKE on the hash
-- column ships in 0020 AFTER the app is deployed to read has_password, so
-- nothing breaks in between.
alter table public.galleries
  add column if not exists has_password boolean
  generated always as (password_hash is not null) stored;
