import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function generateFavicon() {
  const svgPath = path.resolve('public/favicon.svg');
  const icoPath = path.resolve('public/favicon.ico');
  
  if (!fs.existsSync(svgPath)) {
    console.error('❌ No se encuentra public/favicon.svg');
    process.exit(1);
  }

  const svgBuffer = fs.readFileSync(svgPath);
  
  // Generar PNG 32x32 y guardarlo como .ico (navegadores modernos lo aceptan)
  // Para ICO real multi-resolución, se necesitaría una librería específica
  const pngBuffer = await sharp(svgBuffer, { density: 300 })
    .resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  
  fs.writeFileSync(icoPath, pngBuffer);
  console.log('✅ favicon.ico generado (PNG 32x32 como ICO) en', icoPath);
  console.log('   Tamaño:', pngBuffer.length, 'bytes');
  
  // También generar apple-touch-icon (180x180)
  const appleIconPath = path.resolve('public/apple-touch-icon.png');
  const appleBuffer = await sharp(svgBuffer, { density: 300 })
    .resize(180, 180, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  fs.writeFileSync(appleIconPath, appleBuffer);
  console.log('✅ apple-touch-icon.png generado en', appleIconPath);
}

generateFavicon().catch(console.error);