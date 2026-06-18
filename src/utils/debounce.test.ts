import { describe, it, expect, vi } from 'vitest';
import { debounce } from './debounce';

describe('Debounce Utility', () => {
  it('delays execution and combines multiple calls', () => {
    vi.useFakeTimers();
    const spy = vi.fn();
    const debounced = debounce(spy, 200);

    debounced(1);
    debounced(2);
    debounced(3);

    expect(spy).not.toHaveBeenCalled();
    vi.advanceTimersByTime(200);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(3);
    vi.useRealTimers();
  });

  it('supports immediate flush', () => {
    vi.useFakeTimers();
    const spy = vi.fn();
    const debounced = debounce(spy, 500);

    debounced('urgent');
    debounced.flush();
    expect(spy).toHaveBeenCalledWith('urgent');
    vi.useRealTimers();
  });
});
