/**
 * Typed debounce utility with flush and cancel support
 */

export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delayMs: number
): {
  (...args: Parameters<T>): void;
  cancel: () => void;
  flush: () => void;
} {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;

  const debounced = (...args: Parameters<T>) => {
    lastArgs = args;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      if (lastArgs) {
        fn(...lastArgs);
        lastArgs = null;
      }
      timer = null;
    }, delayMs);
  };

  debounced.cancel = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    lastArgs = null;
  };

  debounced.flush = () => {
    if (timer && lastArgs) {
      clearTimeout(timer);
      fn(...lastArgs);
      timer = null;
      lastArgs = null;
    }
  };

  return debounced;
}
