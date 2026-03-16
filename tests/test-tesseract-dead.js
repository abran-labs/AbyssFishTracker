import fs from 'fs';
import Tesseract from 'tesseract.js';

async function test() {
  const img1 = fs.readFileSync('tests/dead-example.png');
  const d1 = await Tesseract.recognize(img1);
  console.log("--- DEAD ORIGINAL ---");
  console.log(d1.data.text);
}
test();
