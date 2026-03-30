import sharp from 'sharp';
import fs from 'fs';

async function generate() {
  const svg = fs.readFileSync('public/icon.svg');
  
  await sharp(svg)
    .resize(192, 192)
    .png()
    .toFile('public/pwa-192x192.png');
    
  await sharp(svg)
    .resize(512, 512)
    .png()
    .toFile('public/pwa-512x512.png');
    
  // Apple touch icon needs to be opaque. Our SVG has background rect, so it's opaque.
  await sharp(svg)
    .resize(180, 180)
    .png()
    .toFile('public/apple-touch-icon.png');
    
  // Simple favicon
  await sharp(svg)
    .resize(32, 32)
    .png()
    .toFile('public/favicon.ico');
    
  console.log('Icons generated successfully!');
}

generate().catch(console.error);
