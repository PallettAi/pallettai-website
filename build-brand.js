'use strict';
// Run: node build-brand.js. Reuses the sibling Studio checkout's installed sharp;
// no website runtime dependency, CDN or package installation is required.
const fs = require('node:fs');
const path = require('node:path');
const sharp = require(require.resolve('sharp', { paths: [path.join(__dirname, '../PallettAI-Studio-src')] }));
async function build() {
  const mark = fs.readFileSync(path.join(__dirname, 'signal-mark.svg'));
  const favicon = fs.readFileSync(path.join(__dirname, 'signal-favicon.svg'));
  await sharp(favicon).resize(32, 32).png().toFile(path.join(__dirname, 'favicon-32.png'));
  await sharp(favicon).resize(180, 180).png().toFile(path.join(__dirname, 'apple-touch-icon.png'));
  await sharp(mark).resize(512, 512).png().toFile(path.join(__dirname, 'logo-mark.png'));
  await sharp(fs.readFileSync(path.join(__dirname, 'signal-logo.svg'))).resize(840, 180).png().toFile(path.join(__dirname, 'logo.png'));
  const art = Buffer.from(fs.readFileSync(path.join(__dirname, 'ribbon-art.svg'), 'utf8').replace(/<title>[\s\S]*?<\/title>|<desc>[\s\S]*?<\/desc>/g, '').replace('<svg ', '<svg x="670" y="-10" width="500" height="625" '));
  const share = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630"><rect width="1200" height="630" fill="#fbf4e8"/><rect x="666" y="32" width="502" height="566" rx="8" fill="#f2e4d4"/>${art.toString()}<g transform="translate(35 27) scale(.65)">${mark.toString().replace(/<\/?svg[^>]*>|<title>[\s\S]*?<\/title>/g, '')}</g><text x="89" y="62" font-family="Arial,sans-serif" font-size="29" font-weight="bold" letter-spacing="-1" fill="#30251f">PallettAI</text><text x="40" y="198" font-family="Arial,sans-serif" font-size="73" font-weight="bold" letter-spacing="-4" fill="#30251f"><tspan x="40">A different</tspan><tspan x="40" dy="80">kind of</tspan><tspan x="40" dy="80">website.</tspan></text><text x="43" y="445" font-family="Arial,sans-serif" font-size="20" fill="#756052">Distinctive by design. Yours to own.</text><rect x="40" y="493" width="210" height="47" rx="5" fill="#f4b183"/><text x="60" y="523" font-family="Arial,sans-serif" font-size="16" fill="#30251f">Websites from £249 ↗</text><text x="40" y="592" font-family="Arial,sans-serif" font-size="14" fill="#756052">pallettai.org / Design + technology</text></svg>`);
  await sharp(share).png().toFile(path.join(__dirname, 'share-v3.png'));
  console.log('Built all 5 raster brand assets; social card: 1200 × 630.');
}
build().catch(error => { console.error(error); process.exitCode = 1; });
