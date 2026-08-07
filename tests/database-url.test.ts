import assert from "node:assert/strict";
import test from "node:test";
import { normalizeDatabaseUrlSslMode } from "../src/db/connection-string";

test("normalizes sslmode=require while preserving other parameters", () => {
  const value = normalizeDatabaseUrlSslMode(
    "postgresql://user:pass@example.com/app?sslmode=require&channel_binding=require",
  );

  assert.equal(
    value,
    "postgresql://user:pass@example.com/app?sslmode=verify-full&channel_binding=require",
  );
});

test("normalizes legacy strict SSL aliases in any query position", () => {
  assert.equal(
    normalizeDatabaseUrlSslMode(
      "postgresql://example.com/app?application_name=web&sslmode=verify-ca",
    ),
    "postgresql://example.com/app?application_name=web&sslmode=verify-full",
  );
  assert.equal(
    normalizeDatabaseUrlSslMode(
      "postgresql://example.com/app?sslmode=prefer",
    ),
    "postgresql://example.com/app?sslmode=verify-full",
  );
});

test("keeps explicit verify-full and URLs without sslmode unchanged", () => {
  const strictUrl = "postgresql://example.com/app?sslmode=verify-full";
  const plainUrl = "postgresql://example.com/app";

  assert.equal(normalizeDatabaseUrlSslMode(strictUrl), strictUrl);
  assert.equal(normalizeDatabaseUrlSslMode(plainUrl), plainUrl);
});
