/**
 * Scans an <img> element's pixels to find the actual visible (non-transparent) bounds.
 * Returns the insets from each edge (how many pixels of transparent padding exist on each side).
 * These insets can be subtracted from getBoundingClientRect() to get the true visible hitbox.
 */
export function getVisibleInsets(img: HTMLImageElement): { top: number; bottom: number; left: number; right: number } {
  const canvas = document.createElement("canvas");
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  canvas.width = w;
  canvas.height = h;
  
  const ctx = canvas.getContext("2d");
  if (!ctx || w === 0 || h === 0) {
    return { top: 0, bottom: 0, left: 0, right: 0 };
  }

  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, w, h).data;

  // Find first/last non-transparent row and column
  let minX = w, maxX = 0, minY = h, maxY = 0;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const alpha = data[(y * w + x) * 4 + 3]; // Alpha channel
      if (alpha > 10) { // threshold to ignore near-transparent pixels
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  // If no visible pixels found, return zero insets
  if (maxX === 0 && maxY === 0) {
    return { top: 0, bottom: 0, left: 0, right: 0 };
  }

  // Calculate what percentage of the image is padding on each side
  // This lets us scale to the rendered size (which may differ from natural size)
  return {
    top: minY / h,      // fraction of height that's transparent on top
    bottom: (h - maxY - 1) / h,  // fraction on bottom
    left: minX / w,     // fraction of width that's transparent on left
    right: (w - maxX - 1) / w,   // fraction on right
  };
}
