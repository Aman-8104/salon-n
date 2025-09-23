const fs = require('fs');
const path = require('path');
const https = require('https');

const root = path.join(__dirname, '..', 'src', 'public', 'images', 'gallery');
const iDir = path.join(root, 'i');
const mDir = path.join(root, 'm');

fs.mkdirSync(iDir, { recursive: true });
fs.mkdirSync(mDir, { recursive: true });

// Curated sample images (barbers, haircuts, grooming) from Unsplash
// Deterministic placeholder seeds so we always have 8 images each
const iUrls = Array.from({ length: 8 }, (_, i) => `https://picsum.photos/seed/ibarber${i + 1}/1600/1200`);
const mUrls = Array.from({ length: 8 }, (_, i) => `https://picsum.photos/seed/mbarber${i + 1}/1600/1200`);

// Fallback provider (robust placeholder service) per index
const iFallback = Array.from({ length: 8 }, (_, idx) => `https://picsum.photos/seed/i${idx + 1}/1600/1200`);
const mFallback = Array.from({ length: 8 }, (_, idx) => `https://picsum.photos/seed/m${idx + 1}/1600/1200`);

function download(url, dest, depth = 0) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const req = https.get(url, { headers: { 'User-Agent': 'node-fetch-script' } }, res => {
      // Follow redirects up to a small limit
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location && depth < 5) {
        file.close(); fs.unlink(dest, () => {});
        return resolve(download(res.headers.location, dest, depth + 1));
      }
      if (res.statusCode !== 200) {
        file.close(); fs.unlink(dest, () => {});
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    });
    req.on('error', err => {
      file.close(); fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function run() {
  console.log('Fetching i-series images...');
  for (let i = 0; i < iUrls.length; i++) {
    const target = path.join(iDir, `i${i + 1}.jpg`);
    try {
      await download(iUrls[i], target);
      console.log('Saved', target);
    } catch (e) {
      console.warn('Primary failed', iUrls[i], e.message, '→ trying fallback');
      try {
        await download(iFallback[i], target);
        console.log('Saved (fallback)', target);
      } catch (e2) {
        console.warn('Fallback failed', iFallback[i], e2.message);
      }
    }
  }
  console.log('Fetching m-series images...');
  for (let i = 0; i < mUrls.length; i++) {
    const target = path.join(mDir, `m${i + 1}.jpg`);
    try {
      await download(mUrls[i], target);
      console.log('Saved', target);
    } catch (e) {
      console.warn('Primary failed', mUrls[i], e.message, '→ trying fallback');
      try {
        await download(mFallback[i], target);
        console.log('Saved (fallback)', target);
      } catch (e2) {
        console.warn('Fallback failed', mFallback[i], e2.message);
      }
    }
  }
  console.log('Done. Refresh your browser to see images.');
}

run().catch(e => { console.error(e); process.exit(1); });
