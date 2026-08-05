import QRCode from 'qrcode';

export const qrErrorCorrectionLevels = [
  { value: 'L', label: 'Low' },
  { value: 'M', label: 'Medium' },
  { value: 'Q', label: 'Quartile' },
  { value: 'H', label: 'High' },
];

export function createQrMatrix(object) {
  const text = getQrText(object);
  if (!text) {
    return null;
  }

  try {
    const qr = QRCode.create(text, {
      errorCorrectionLevel: object.errorCorrectionLevel || 'M',
    });

    return {
      data: Array.from(qr.modules.data),
      size: qr.modules.size,
    };
  } catch {
    return null;
  }
}

export function qrToDataUrl(object, widthPx = 512) {
  const text = getQrText(object);
  if (!text) {
    return Promise.resolve(null);
  }

  return QRCode.toDataURL(text, {
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
    errorCorrectionLevel: object.errorCorrectionLevel || 'M',
    margin: 1,
    scale: 8,
    width: widthPx,
  }).catch(() => null);
}

function getQrText(object) {
  return String(object.text || '').trim();
}
