import fs from 'fs';
import { extractFishData } from '../src/lib/ocr.js';

async function test() {
  const fileBuffer = fs.readFileSync('tests/dead-example.png');
  const blob = new Blob([fileBuffer], { type: 'image/png' });
  
  global.document = {
    createElement: () => ({
      width: 0, height: 0,
      getContext: () => null
    })
  };
  global.Image = class {
    constructor() {
      setTimeout(() => this.onload(), 10);
    }
  };
  global.window = {};
  
  try {
    const result = await extractFishData(blob);
    console.log(JSON.stringify(result, null, 2));
  } catch(e) { console.error(e) }
}
test();
