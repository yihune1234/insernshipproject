import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const sourceImage = path.join(
  'C:\\Users\\Core X\\.gemini\\antigravity-ide\\brain\\5eb220c4-6748-40ee-886a-2dbf4b050b18',
  'pwa_app_icon_1780469047771.png'
);
const outputDir = path.join(__dirname, '..', 'public', 'icons');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

async function generateIcons() {
  for (const size of sizes) {
    const outFile = path.join(outputDir, `icon-${size}x${size}.png`);
    await sharp(sourceImage)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 27, g: 42, b: 47, alpha: 1 }, // #1B2A2F
      })
      .png()
      .toFile(outFile);
    console.log(`✅  Generated icon-${size}x${size}.png`);
  }

  // Also copy 96x96 as shortcut icons
  for (const name of ['shortcut-credentials', 'shortcut-scan']) {
    const outFile = path.join(outputDir, `${name}.png`);
    await sharp(sourceImage)
      .resize(96, 96, {
        fit: 'contain',
        background: { r: 27, g: 42, b: 47, alpha: 1 },
      })
      .png()
      .toFile(outFile);
    console.log(`✅  Generated ${name}.png`);
  }

  console.log('\n🎉  All icons generated successfully in public/icons/');
}

generateIcons().catch((err) => {
  console.error('❌  Icon generation failed:', err);
  process.exit(1);
});
