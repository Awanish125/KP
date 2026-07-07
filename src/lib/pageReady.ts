/**
 * Page-ready gate — lets expensive components (WebGL scenes, heavy asset
 * loaders) delay the page-reveal until they are fully warm.
 *
 * Usage:
 *   holdPageReady('my-token')   // call on mount / async init start
 *   releasePageReady('my-token') // call when warm and ready
 *   onPageReady(callback)        // PremiumLoader calls this; fires when all tokens clear
 *
 * If no tokens are held when onPageReady is called, the callback fires on the
 * next microtask tick (never synchronously, to avoid stack surprises).
 */

const _tokens = new Set<string>();
const _callbacks: Array<() => void> = [];

export function holdPageReady(token: string): void {
  _tokens.add(token);
}

export function releasePageReady(token: string): void {
  _tokens.delete(token);
  if (_tokens.size === 0) _flush();
}

export function onPageReady(cb: () => void): void {
  if (_tokens.size === 0) {
    Promise.resolve().then(cb);
    return;
  }
  _callbacks.push(cb);
}

function _flush(): void {
  const cbs = _callbacks.splice(0);
  cbs.forEach((cb) => cb());
}
