export function removeSideBars(data: Uint8ClampedArray, width: number, height: number): void {
  const isBar = (x: number): boolean => {
    for (let y = 0; y < height; y++) {
      const i = (y * width + x) * 4;
      if (data[i + 3] > 16 && Math.max(data[i], data[i + 1], data[i + 2]) > 28) return false;
    }
    return true;
  };
  let left = 0;
  let right = width - 1;
  while (left < width && isBar(left)) left++;
  while (right >= left && isBar(right)) right--;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < left; x++) data[(y * width + x) * 4 + 3] = 0;
    for (let x = right + 1; x < width; x++) data[(y * width + x) * 4 + 3] = 0;
  }
}

export function removeGreen(data: Uint8ClampedArray): void {
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const excess = g - Math.max(r, b);
    if (g > 70 && excess > 20) {
      data[i + 3] = Math.round(data[i + 3] * (1 - Math.min(1, (excess - 20) / 65)));
      data[i + 1] = Math.min(g, Math.max(r, b) + 20);
    }
  }
}
