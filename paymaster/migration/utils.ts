export function resolveWithTimeout<TValue extends any>(
  value: TValue,
  timeout: number
) {
  return new Promise<TValue>((ok) => {
    setTimeout(() => {
      ok(value);
    }, timeout);
  });
}
