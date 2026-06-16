// rate-limiter.js — proactive per-minute throttling (sliding 60s window)
import { sleep } from "./util.js";

export class RateLimiter {
  constructor(maxPerMin) {
    this.max = Math.max(1, maxPerMin | 0);
    this.calls = [];
  }

  async acquire() {
    while (true) {
      const now = Date.now();
      this.calls = this.calls.filter((t) => now - t < 60000);
      if (this.calls.length < this.max) {
        this.calls.push(Date.now());
        return;
      }
      await sleep(Math.min(60000 - (now - this.calls[0]), 60000));
    }
  }
}
