/** Keep a slot until the response body has been consumed, not just its headers. */
export function createRequestPool(limit: number) {
  let active = 0;
  const waiting: Array<() => void> = [];
  return async function run<T>(task: () => Promise<T>): Promise<T> {
    await new Promise<void>(resolve => {
      const enter = () => { active++; resolve(); };
      if (active < limit) enter();
      else waiting.push(enter);
    });
    try { return await task(); }
    finally { active--; waiting.shift()?.(); }
  };
}