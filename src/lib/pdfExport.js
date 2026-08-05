import { jsPDF } from 'jspdf';
import { getPdfFontFamily } from './fontLibrary';
import { qrToDataUrl } from './qrCode';

const textLineHeightFactor = 1.05;

export async function buildTemplatePdf(template) {
  const pdf = createPdfForTemplate(template);
  await drawTemplatePage(pdf, template);

  return pdf;
}

export async function buildTemplatesPdf(templates) {
  if (!templates.length) {
    throw new Error('At least one template is required.');
  }

  const [firstTemplate, ...remainingTemplates] = templates;
  const pdf = createPdfForTemplate(firstTemplate);
  await drawTemplatePage(pdf, firstTemplate);

  for (const template of remainingTemplates) {
    pdf.addPage([template.widthMm, template.heightMm], getPdfOrientation(template));
    await drawTemplatePage(pdf, template);
  }

  return pdf;
}

export async function exportTemplateToPdf(template) {
  const pdf = await buildTemplatePdf(template);
  pdf.save(`${fileSafe(template.name || 'label')}.pdf`);
}

export async function printTemplateToPdf(template) {
  const pdf = await buildTemplatePdf(template);
  printPdf(pdf);
}

export async function printTemplatesToPdf(templates) {
  const pdf = await buildTemplatesPdf(templates);
  printPdf(pdf);
}

function createPdfForTemplate(template) {
  return new jsPDF({
    orientation: getPdfOrientation(template),
    unit: 'mm',
    format: [template.widthMm, template.heightMm],
  });
}

async function drawTemplatePage(pdf, template) {
  pdf.setFillColor(template.background || '#ffffff');
  pdf.rect(0, 0, template.widthMm, template.heightMm, 'F');

  for (const object of template.objects) {
    if (object.type === 'text') {
      drawText(pdf, object);
    }

    if (object.type === 'rect') {
      drawRect(pdf, object);
    }

    if (object.type === 'ellipse') {
      drawEllipse(pdf, object);
    }

    if (object.type === 'line') {
      drawLine(pdf, object);
    }

    if (object.type === 'image' && object.src) {
      await drawImage(pdf, object);
    }

    if (object.type === 'qr') {
      await drawQrCode(pdf, object);
    }
  }
}

function getPdfOrientation(template) {
  return template.widthMm >= template.heightMm ? 'landscape' : 'portrait';
}

function printPdf(pdf) {
  const url = URL.createObjectURL(pdf.output('blob'));

  const iframe = document.createElement('iframe');
  iframe.setAttribute('style', 'position:fixed;top:0;left:0;width:0;height:0;border:0;');
  iframe.src = url;

  const cleanup = () => {
    if (iframe.parentNode) {
      iframe.parentNode.removeChild(iframe);
    }
    URL.revokeObjectURL(url);
  };

  iframe.onload = () => {
    const frameWindow = iframe.contentWindow;
    if (!frameWindow) {
      cleanup();
      return;
    }

    frameWindow.addEventListener('afterprint', cleanup, { once: true });
    frameWindow.focus();
    frameWindow.print();
    window.setTimeout(cleanup, 120000);
  };

  document.body.appendChild(iframe);
}

function drawText(pdf, object) {
  pdf.setFont(getPdfFontFamily(object.fontFamily), getPdfFontStyle(object));
  pdf.setFontSize(mmToPt(object.fontSize));
  pdf.setTextColor(object.color || '#000000');

  const text = object.text || '';
  const lines = pdf.splitTextToSize(text, object.width);
  const lineHeight = object.fontSize * textLineHeightFactor;
  const textBlockHeight = Math.max(lines.length, 1) * lineHeight;
  const x = object.x + textOffset(object);
  const y = object.y + Math.max((object.height - textBlockHeight) / 2, 0) + object.fontSize;

  pdf.text(lines, x, y, {
    align: object.textAlign || 'left',
    charSpace: object.letterSpacing || 0,
    lineHeightFactor: textLineHeightFactor,
    maxWidth: object.width,
  });

  if (object.textDecoration === 'underline') {
    drawTextUnderline(pdf, object, lines, lineHeight, x, y);
  }
}

function getPdfFontStyle(object) {
  const isBold = object.fontWeight === '700' || object.fontWeight === 'bold';
  const isItalic = object.fontStyle === 'italic';

  if (isBold && isItalic) {
    return 'bolditalic';
  }

  if (isBold) {
    return 'bold';
  }

  if (isItalic) {
    return 'italic';
  }

  return 'normal';
}

function drawTextUnderline(pdf, object, lines, lineHeight, anchorX, startY) {
  const underlineOffset = object.fontSize * 0.08;
  pdf.setDrawColor(object.color || '#000000');
  pdf.setLineWidth(Math.max(0.08, object.fontSize * 0.05));

  lines.forEach((line, index) => {
    const textWidth = pdf.getTextWidth(line);
    const lineY = startY + index * lineHeight + underlineOffset;
    let startX = anchorX;

    if (object.textAlign === 'center') {
      startX = anchorX - textWidth / 2;
    } else if (object.textAlign === 'right') {
      startX = anchorX - textWidth;
    }

    pdf.line(startX, lineY, startX + textWidth, lineY);
  });
}

function drawRect(pdf, object) {
  const fill = object.fill && object.fill !== 'transparent';
  const strokeWidth = object.strokeWidth || 0.2;
  const lineStyle = object.lineStyle || 'solid';
  pdf.setLineWidth(strokeWidth);
  pdf.setDrawColor(object.stroke || '#000000');

  if (lineStyle === 'double') {
    const gap = object.doubleGap || 1;

    if (fill) {
      pdf.setFillColor(object.fill);
      drawRectPath(pdf, object, 'F');
    }

    drawRectPath(pdf, object, 'S');

    const inner = {
      x: object.x + strokeWidth + gap,
      y: object.y + strokeWidth + gap,
      width: object.width - 2 * strokeWidth - 2 * gap,
      height: object.height - 2 * strokeWidth - 2 * gap,
      radius: Math.max(0, (object.radius || 0) - strokeWidth - gap),
    };

    if (inner.width > 0 && inner.height > 0) {
      drawRectPath(pdf, inner, 'S');
    }

    return;
  }

  if (fill) {
    pdf.setFillColor(object.fill);
  }

  pdf.setLineDashPattern(getPdfDashPattern(lineStyle, strokeWidth), 0);
  drawRectPath(pdf, object, fill ? 'FD' : 'S');
  pdf.setLineDashPattern([], 0);
}

function drawRectPath(pdf, object, mode) {
  if (object.radius > 0) {
    pdf.roundedRect(object.x, object.y, object.width, object.height, object.radius, object.radius, mode);
    return;
  }

  pdf.rect(object.x, object.y, object.width, object.height, mode);
}

function drawEllipse(pdf, object) {
  const fill = object.fill && object.fill !== 'transparent';
  const strokeWidth = object.strokeWidth || 0.2;
  const lineStyle = object.lineStyle || 'solid';
  pdf.setLineWidth(strokeWidth);
  pdf.setDrawColor(object.stroke || '#000000');

  if (lineStyle === 'double') {
    const gap = object.doubleGap || 1;

    if (fill) {
      pdf.setFillColor(object.fill);
      drawEllipsePath(pdf, object, 'F');
    }

    drawEllipsePath(pdf, object, 'S');

    const inset = strokeWidth + gap + strokeWidth / 2;
    const inner = {
      width: Math.max(object.width - 2 * inset, 0),
      height: Math.max(object.height - 2 * inset, 0),
    };

    if (inner.width > 0 && inner.height > 0) {
      drawEllipsePath(
        pdf,
        {
          x: object.x + inset,
          y: object.y + inset,
          width: inner.width,
          height: inner.height,
        },
        'S',
      );
    }

    return;
  }

  if (fill) {
    pdf.setFillColor(object.fill);
  }

  pdf.setLineDashPattern(getPdfDashPattern(lineStyle, strokeWidth), 0);
  drawEllipsePath(pdf, object, fill ? 'FD' : 'S');
  pdf.setLineDashPattern([], 0);
}

function drawEllipsePath(pdf, object, mode) {
  pdf.ellipse(
    object.x + object.width / 2,
    object.y + object.height / 2,
    object.width / 2,
    object.height / 2,
    mode,
  );
}

function drawLine(pdf, object) {
  const strokeWidth = object.strokeWidth || 0.2;
  const lineStyle = object.lineStyle || 'solid';
  pdf.setLineWidth(strokeWidth);
  pdf.setDrawColor(object.stroke || '#000000');

  const x1 = object.x;
  const y1 = object.y;
  const x2 = object.x + object.width;
  const y2 = object.y + object.height;
  const isHorizontal = Math.abs(object.height) < 0.01;

  if (lineStyle === 'double') {
    const gap = object.doubleGap || 1;

    if (isHorizontal) {
      const firstY = y1 + strokeWidth / 2;
      const secondY = y1 + strokeWidth / 2 + strokeWidth + gap;
      pdf.line(x1, firstY, x2, firstY);
      pdf.line(x1, secondY, x2, secondY);
      return;
    }

    const length = Math.hypot(object.width, object.height) || 1;
    const offsetX = (-object.height / length) * ((strokeWidth + gap) / 2);
    const offsetY = (object.width / length) * ((strokeWidth + gap) / 2);
    pdf.line(x1 + offsetX, y1 - offsetY, x2 + offsetX, y2 - offsetY);
    pdf.line(x1 - offsetX, y1 + offsetY, x2 - offsetX, y2 + offsetY);
    return;
  }

  pdf.setLineDashPattern(getPdfDashPattern(lineStyle, strokeWidth), 0);
  pdf.line(x1, y1, x2, y2);
  pdf.setLineDashPattern([], 0);
}

function getPdfDashPattern(lineStyle, strokeWidth) {
  switch (lineStyle) {
    case 'dashed':
      return [strokeWidth * 6, strokeWidth * 3];
    case 'dotted':
      return [strokeWidth, strokeWidth * 2];
    case 'dash-dot':
      return [strokeWidth * 6, strokeWidth * 2, strokeWidth, strokeWidth * 2];
    case 'long-dash':
      return [strokeWidth * 10, strokeWidth * 4];
    default:
      return [];
  }
}

async function drawImage(pdf, object) {
  const pngSrc = await toPngDataUrl(object.src);
  pdf.addImage(pngSrc, 'PNG', object.x, object.y, object.width, object.height, undefined, 'FAST');
}

async function drawQrCode(pdf, object) {
  const pngSrc = await qrToDataUrl(object);
  if (!pngSrc) {
    return;
  }

  pdf.addImage(pngSrc, 'PNG', object.x, object.y, object.width, object.height, undefined, 'FAST');
}

function textOffset(object) {
  if (object.textAlign === 'center') {
    return object.width / 2;
  }

  if (object.textAlign === 'right') {
    return object.width;
  }

  return 0;
}

function mmToPt(mm) {
  return mm * 2.8346456693;
}

function fileSafe(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'label';
}

function toPngDataUrl(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth || image.width;
      canvas.height = image.naturalHeight || image.height;
      const context = canvas.getContext('2d');
      context.drawImage(image, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    image.onerror = reject;
    image.src = src;
  });
}
