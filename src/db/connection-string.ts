const LEGACY_STRICT_SSL_MODE =
  /([?&])sslmode=(?:prefer|require|verify-ca)(?=(&|$))/i;

export function normalizeDatabaseUrlSslMode(connectionString: string) {
  return connectionString.replace(
    LEGACY_STRICT_SSL_MODE,
    "$1sslmode=verify-full",
  );
}
