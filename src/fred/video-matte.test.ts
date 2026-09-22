import { expect, it } from 'vitest';
import { removeGreen, removeSideBars } from './video-matte';

it('remove margens pretas sem apagar detalhes pretos dentro do personagem', () => {
  const pixels = new Uint8ClampedArray([
    0,0,0,255, 200,100,50,255, 0,0,0,255, 200,100,50,255, 0,0,0,255,
  ]);
  removeSideBars(pixels, 5, 1);
  expect([pixels[3], pixels[7], pixels[11], pixels[15], pixels[19]]).toEqual([0,255,255,255,0]);
});

it('remove verde e preserva transparência e cores do personagem', () => {
  const pixels = new Uint8ClampedArray([0,255,0,255, 200,180,140,255, 0,255,0,0]);
  removeGreen(pixels);
  expect([pixels[3], pixels[7], pixels[11]]).toEqual([0,255,0]);
});
