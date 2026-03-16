import Tesseract from 'tesseract.js';
import fs from 'fs';
import { createCanvas, loadImage } from 'canvas';

async function test() {
  // Pre-process image: grayscale, invert, contrast
  const img = await loadImage('docs/Info/image.png');
  const canvas = createCanvas(img.width, img.height);
  const ctx = canvas.getContext('2d');
  
  // Normal OCR
  console.log("--- NORMAL OCR ---");
  const result1 = await Tesseract.recognize('docs/Info/image.png', 'eng');
  console.log(result1.data.text);
  
  // Pre-processed OCR
  ctx.drawImage(img, 0, 0);
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;
  
  for (let i = 0; i < data.length; i += 4) {
    // grayscale
    const avg = (data[i] + data[i+1] + data[i+2]) / 3;
    // threshold / contrast & invert
    const val = avg > 80 ? 0 : 255; // Dark text on light background is better for Tesseract
    
    data[i] = val;
    data[i+1] = val;
    data[i+2] = val;
  }
  ctx.putImageData(imgData, 0, 0);
  
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync('test-processed.png', buffer);
  
  console.log("\n--- PROCESSED OCR ---");
  const result2 = await Tesseract.recognize(buffer, 'eng');
  console.log(result2.data.text);
}

test();
