import { describe, expect, it } from 'vitest';
import { parseByteRange } from './media-range';

describe('parseByteRange', () => {
  it('interpreta intervalos normais e abertos', () => {
    expect(parseByteRange('bytes=0-1023', 5_000)).toEqual({ start: 0, end: 1023 });
    expect(parseByteRange('bytes=1024-', 5_000)).toEqual({ start: 1024, end: 4_999 });
  });

  it('interpreta sufixos usados para metadados MP4', () => {
    expect(parseByteRange('bytes=-1024', 5_000)).toEqual({ start: 3_976, end: 4_999 });
  });

  it('rejeita intervalos inválidos', () => {
    expect(parseByteRange('bytes=-', 5_000)).toBeNull();
    expect(parseByteRange('bytes=9000-', 5_000)).toBeNull();
    expect(parseByteRange('items=0-10', 5_000)).toBeNull();
  });
});
