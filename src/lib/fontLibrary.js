export const fontLibrary = [
  {
    label: 'Square 721',
    value: 'Square 721',
    cssFamily: '"Square 721", "Square 721 BT", Eurostile, Microgramma, Arial, sans-serif',
    pdfFamily: 'helvetica',
  },
  {
    label: 'Square 721 BT',
    value: 'Square 721 BT',
    cssFamily: '"Square 721 BT", "Square 721", Eurostile, Microgramma, Arial, sans-serif',
    pdfFamily: 'helvetica',
  },
  {
    label: 'Square 721 Condensed',
    value: 'Square 721 Cn BT',
    cssFamily: '"Square 721 Cn BT", "Square 721", "Arial Narrow", Arial, sans-serif',
    pdfFamily: 'helvetica',
  },
  {
    label: 'Square 721 Extended',
    value: 'Square 721 Ex BT',
    cssFamily: '"Square 721 Ex BT", "Square 721", Arial, sans-serif',
    pdfFamily: 'helvetica',
  },
  {
    label: 'Arial',
    value: 'Arial',
    cssFamily: 'Arial, Helvetica, sans-serif',
    pdfFamily: 'helvetica',
  },
  {
    label: 'Helvetica',
    value: 'Helvetica',
    cssFamily: 'Helvetica, Arial, sans-serif',
    pdfFamily: 'helvetica',
  },
  {
    label: 'Verdana',
    value: 'Verdana',
    cssFamily: 'Verdana, Geneva, sans-serif',
    pdfFamily: 'helvetica',
  },
  {
    label: 'Tahoma',
    value: 'Tahoma',
    cssFamily: 'Tahoma, Geneva, sans-serif',
    pdfFamily: 'helvetica',
  },
  {
    label: 'Trebuchet MS',
    value: 'Trebuchet MS',
    cssFamily: '"Trebuchet MS", Helvetica, sans-serif',
    pdfFamily: 'helvetica',
  },
  {
    label: 'Courier New',
    value: 'Courier New',
    cssFamily: '"Courier New", Courier, monospace',
    pdfFamily: 'courier',
  },
  {
    label: 'Times New Roman',
    value: 'Times New Roman',
    cssFamily: '"Times New Roman", Times, serif',
    pdfFamily: 'times',
  },
  {
    label: 'Georgia',
    value: 'Georgia',
    cssFamily: 'Georgia, "Times New Roman", serif',
    pdfFamily: 'times',
  },
  {
    label: 'Impact',
    value: 'Impact',
    cssFamily: 'Impact, Haettenschweiler, "Arial Narrow Bold", sans-serif',
    pdfFamily: 'helvetica',
  },
  {
    label: 'Generic Sans Serif',
    value: 'sans-serif',
    cssFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    pdfFamily: 'helvetica',
  },
  {
    label: 'Generic Serif',
    value: 'serif',
    cssFamily: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
    pdfFamily: 'times',
  },
  {
    label: 'Generic Monospace',
    value: 'monospace',
    cssFamily: 'ui-monospace, SFMono-Regular, Consolas, "Liberation Mono", "Courier New", monospace',
    pdfFamily: 'courier',
  },
  {
    label: 'Generic Cursive',
    value: 'cursive',
    cssFamily: '"Comic Sans MS", "Brush Script MT", cursive',
    pdfFamily: 'helvetica',
  },
  {
    label: 'Generic Fantasy',
    value: 'fantasy',
    cssFamily: 'Impact, fantasy',
    pdfFamily: 'helvetica',
  },
];

export const defaultFontFamily = 'Square 721';

export function getFontOption(fontFamily = defaultFontFamily) {
  return fontLibrary.find((font) => font.value === fontFamily) || fontLibrary.find((font) => font.value === defaultFontFamily);
}

export function getFontCssFamily(fontFamily) {
  return getFontOption(fontFamily).cssFamily;
}

export function getPdfFontFamily(fontFamily) {
  return getFontOption(fontFamily).pdfFamily;
}
