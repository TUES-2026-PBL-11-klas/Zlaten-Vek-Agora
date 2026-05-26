export function passportJwtSecret() {
  return (_req: unknown, _token: unknown, done: (err: Error | null, key?: string) => void) =>
    done(null, "test-secret");
}
