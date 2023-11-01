import { Duration } from "./duration";

export class Timer {
  private expiry: Duration;
  private start: Date;

  constructor(expiry: Duration) {
    this.expiry = expiry;
    this.start = new Date();
  }

  expired(): boolean {
    const d = Duration.since(this.start);
    return d.isGreaterThan(this.expiry);
  }

  async sleep(duration: Duration): Promise<void> {
    const ms = duration.milliseconds();
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
