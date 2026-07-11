import fs from 'fs';
import { PDFParse } from 'pdf-parse';

async function test() {
  const parser = new PDFParse();
  console.log("PDFParse instance:", typeof parser.load, typeof parser.getText);
}

test();
