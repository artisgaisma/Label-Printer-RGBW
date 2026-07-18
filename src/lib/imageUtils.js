const alphaThreshold = 20;
const luminanceThreshold = 240;

export function convertImageToBlack(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth || image.width;
      canvas.height = image.naturalHeight || image.height;
      const context = canvas.getContext('2d');
      context.drawImage(image, 0, 0);
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const { data } = imageData;
      const hasTransparency = detectTransparency(data);
      const darkBackground = averageLuminance(data) < 128;

      for (let index = 0; index < data.length; index += 4) {
        const red = data[index];
        const green = data[index + 1];
        const blue = data[index + 2];
        const alpha = data[index + 3];
        const luminance = getLuminance(red, green, blue);
        const opacity = getBlackOpacity(alpha, luminance, hasTransparency, darkBackground);

        if (opacity > alphaThreshold) {
          data[index] = 0;
          data[index + 1] = 0;
          data[index + 2] = 0;
          data[index + 3] = opacity;
        } else {
          data[index + 3] = 0;
        }
      }

      context.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    image.onerror = reject;
    image.src = src;
  });
}

function getBlackOpacity(alpha, luminance, hasTransparency, darkBackground) {
  if (hasTransparency) {
    if (alpha < 255) {
      return alpha;
    }

    return luminance < luminanceThreshold ? 255 : 0;
  }

  if (darkBackground) {
    return Math.min(255, Math.round(luminance));
  }

  return Math.min(255, Math.round(255 - luminance));
}

function detectTransparency(data) {
  let transparentPixels = 0;
  const totalPixels = data.length / 4;

  for (let index = 3; index < data.length; index += 4) {
    if (data[index] < 250) {
      transparentPixels += 1;
    }
  }

  return transparentPixels > totalPixels * 0.01;
}

function averageLuminance(data) {
  let total = 0;
  let count = 0;

  for (let index = 0; index < data.length; index += 4) {
    if (data[index + 3] === 0) {
      continue;
    }

    total += getLuminance(data[index], data[index + 1], data[index + 2]);
    count += 1;
  }

  return count === 0 ? 255 : total / count;
}

function getLuminance(red, green, blue) {
  return 0.299 * red + 0.587 * green + 0.114 * blue;
}
