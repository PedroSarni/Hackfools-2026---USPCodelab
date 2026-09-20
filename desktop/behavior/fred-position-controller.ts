import type { BrowserWindow, Rectangle, Screen } from 'electron';
import type { FredPositionIntent } from '../../shared/contracts';

export const FRED_SIZE = { width: 242, height: 340 };

function overlap(a: Rectangle, b: Rectangle): number {
  return Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x)) *
    Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
}

export function chooseFredPosition(area: Rectangle, intent: FredPositionIntent, obstacles: Rectangle[] = []): Rectangle {
  const width = Math.min(FRED_SIZE.width, area.width);
  const height = Math.min(FRED_SIZE.height, area.height);
  const inset = Math.min(18, Math.max(0, (area.width - width) / 2), Math.max(0, (area.height - height) / 2));
  const left = area.x + inset;
  const right = area.x + area.width - width - inset;
  const top = area.y + inset;
  const bottom = area.y + area.height - height - inset;
  const middle = area.y + (area.height - height) / 2;
  const slots: Record<FredPositionIntent, [number, number][]> = {
    discreet: [[right, bottom], [left, bottom], [right, top], [left, top]],
    attention: [[left, middle], [right, middle], [left, top], [right, top]],
    celebrate: [[right, top], [left, top], [right, bottom], [left, bottom]],
    rest: [[left, bottom], [right, bottom], [left, top], [right, top]],
  };
  return slots[intent].map(([x, y], index) => {
    const rectangle = { x: Math.round(x), y: Math.round(y), width, height };
    return { rectangle, score: obstacles.reduce((sum, obstacle) => sum + overlap(rectangle, obstacle), 0) + index * 100 };
  }).sort((a, b) => a.score - b.score)[0]!.rectangle;
}

export class FredPositionController {
  private timer?: NodeJS.Timeout;
  private lastMoveAt = 0;
  private intent: FredPositionIntent = 'discreet';

  constructor(
    private readonly screen: Screen,
    private readonly fred: BrowserWindow,
    private readonly getObstacles: () => Rectangle[],
    private readonly supported: boolean,
    private readonly onStatus: (status: 'active' | 'limited') => void,
  ) {}

  request(intent: FredPositionIntent, immediate = false): void {
    this.intent = intent;
    clearTimeout(this.timer);
    const wait = immediate ? 0 : Math.max(0, 1_000 - (Date.now() - this.lastMoveAt));
    this.timer = setTimeout(() => this.apply(), wait);
  }

  dispose(): void { clearTimeout(this.timer); }

  private apply(): void {
    if (this.fred.isDestroyed()) return;
    if (!this.supported) return this.onStatus('limited');
    const display = this.screen.getDisplayMatching(this.fred.getBounds());
    const target = chooseFredPosition(display.workArea, this.intent, this.getObstacles());
    this.lastMoveAt = Date.now();
    this.fred.setPosition(target.x, target.y, true);
    const actual = this.fred.getBounds();
    this.onStatus(Math.abs(actual.x - target.x) < 5 && Math.abs(actual.y - target.y) < 5 ? 'active' : 'limited');
  }
}
