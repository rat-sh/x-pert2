// Shared PDF generation helpers — individual features implement their own download functions
// using jsPDF + jspdf-autotable; this file exports common config and helpers.

export const PDF_DEFAULTS = {
  fontSize: 10,
  margin: { top: 20, left: 15, right: 15, bottom: 20 },
  primaryColor: [79, 70, 229] as [number, number, number], // indigo-600
};

export function toBase64(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext('2d')?.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = url;
  });
}
