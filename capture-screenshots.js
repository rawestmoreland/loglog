#!/usr/bin/env node
/**
 * Captures each phone mockup from app-store-screenshots.html
 * at 3x resolution (~1170×2532px) and saves to ./screenshots/
 *
 * Usage:
 *   npm install --save-dev puppeteer
 *   node capture-screenshots.js
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const HTML_FILE = path.resolve(__dirname, 'app-store-screenshots.html');
const OUTPUT_DIR = path.resolve(__dirname, 'screenshots');
const DEVICE_SCALE = 3; // 3× Retina → ~1170×2532px per phone frame

const SCREEN_NAMES = [
  '01-map',
  '02-during-sesh',
  '03-log-book',
  '04-poop-pals',
  '05-session-details',
];

(async () => {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  // Wide viewport so all 5 phones render in a single row
  await page.setViewport({
    width: 2600,
    height: 1100,
    deviceScaleFactor: DEVICE_SCALE,
  });

  await page.goto(`file://${HTML_FILE}`, { waitUntil: 'networkidle0' });

  // Solid white background — App Store rejects PNGs with alpha channels
  await page.evaluate(() => {
    document.documentElement.style.background = '#ffffff';
    document.body.style.background = '#ffffff';
  });

  // Give web fonts a moment to finish rendering
  await new Promise(r => setTimeout(r, 1500));

  const phones = await page.$$('.phone');

  if (phones.length === 0) {
    console.error('No .phone elements found — check that the HTML file path is correct.');
    await browser.close();
    process.exit(1);
  }

  console.log(`Capturing ${phones.length} screens at ${DEVICE_SCALE}× scale...\n`);

  for (let i = 0; i < phones.length; i++) {
    const name = SCREEN_NAMES[i] ?? `screen-${i + 1}`;
    const outPath = path.join(OUTPUT_DIR, `${name}.png`);

    await phones[i].screenshot({ path: outPath });

    // Print dimensions for reference
    const box = await phones[i].boundingBox();
    const w = Math.round(box.width * DEVICE_SCALE);
    const h = Math.round(box.height * DEVICE_SCALE);
    console.log(`✓  ${name}.png  (${w}×${h}px)`);
  }

  await browser.close();
  console.log(`\nDone — screenshots saved to ./screenshots/`);
})();
