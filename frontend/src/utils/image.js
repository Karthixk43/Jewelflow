// Compresses/resizes photos in the browser before upload.
// Accepts ANY photo format the browser can decode (JPEG, PNG, WebP, GIF, BMP,
// AVIF, and HEIC on iPhones) and converts it to an optimized JPEG.
// Phone camera photos of 5-12MB become ~300-500KB, so uploads never fail
// and the store loads fast.

// Formats every browser can display as-is
const WEB_SAFE = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export const compressImage = (file, maxSize = 1400, quality = 0.85) =>
  new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      return reject(new Error(`"${file.name}" is not a photo`));
    }

    // Already small and web-friendly — nothing to do
    if (WEB_SAFE.includes(file.type) && file.size < 300 * 1024) {
      return resolve(file);
    }

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;

      if (width > maxSize || height > maxSize) {
        const scale = maxSize / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      // White background so transparent PNGs don't turn black as JPEG
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) return resolve(file);
          const name = file.name.replace(/\.\w+$/, '') + '.jpg';
          resolve(new File([blob], name, { type: 'image/jpeg' }));
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      if (WEB_SAFE.includes(file.type)) {
        // Browser can still display it — upload the original
        resolve(file);
      } else {
        // Format this browser can't read (e.g. HEIC on desktop Chrome)
        reject(new Error(
          `"${file.name}" couldn't be read on this device. Tip: send it via WhatsApp to yourself first (it converts to JPG), or take a screenshot.`
        ));
      }
    };

    img.src = url;
  });
