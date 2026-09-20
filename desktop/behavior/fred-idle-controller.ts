export class FredIdleController {
  private timer?: NodeJS.Timeout;
  private scrolling = false;
  private hovered = false;
  private disposed = false;

  constructor(
    private readonly canStart: () => boolean,
    private readonly onActivity: (scrolling: boolean) => void,
    private readonly onCaught: () => void,
    private readonly random: () => number = Math.random,
    private readonly idleDelayMs = 20_000,
  ) { this.schedule(false); }

  hover(inside: boolean): void {
    this.hovered = inside;
    if (!inside || !this.scrolling) return;
    clearTimeout(this.timer);
    this.setScrolling(false);
    this.onCaught();
    this.schedule(true);
  }

  reset(): void {
    this.setScrolling(false);
    this.schedule(false);
  }

  dispose(): void {
    this.disposed = true;
    clearTimeout(this.timer);
  }

  private schedule(caught: boolean): void {
    clearTimeout(this.timer);
    if (!this.disposed) this.timer = setTimeout(() => this.start(), (caught ? 45_000 : this.idleDelayMs) + this.random() * 25_000);
  }

  private start(): void {
    if (this.disposed) return;
    if (this.hovered || !this.canStart()) return this.schedule(false);
    this.setScrolling(true);
    this.timer = setTimeout(() => { this.setScrolling(false); this.schedule(false); }, 8_000 + this.random() * 4_000);
  }

  private setScrolling(value: boolean): void {
    if (this.scrolling === value) return;
    this.scrolling = value;
    this.onActivity(value);
  }
}
