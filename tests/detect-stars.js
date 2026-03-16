import fs from 'fs';
import { PNG } from 'pngjs';

function analyzeStars(filename) {
  const data = fs.readFileSync(filename);
  const png = PNG.sync.read(data);
  const { width, height, data: pixels } = png;

  let yellowPixels = 0;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (width * y + x) << 2;
      const r = pixels[idx];
      const g = pixels[idx+1];
      const b = pixels[idx+2];
      
      // Look for bright yellow/gold
      if (r > 150 && g > 150 && b < 100) {
        yellowPixels++;
      }
    }
  }
  
  console.log(`[${filename}] Yellow pixels: ${yellowPixels}`);
}

analyzeStars('public/ocr-example.png'); // 3 stars
analyzeStars('tests/dead-example.png'); // dead
