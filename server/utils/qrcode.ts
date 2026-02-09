
/**
 * Generates a QR code from a given string.
 * @param text The text to encode in the QR code.
 * @returns A promise that resolves with the QR code as a data URL string.
 */
export const generateQRCode = async (text: string): Promise<string> => {
  try {
    const config = useRuntimeConfig();
    const workerUrl = config.pdf_worker_api_url || 'http://localhost:5000';
    const response = await fetch(`${workerUrl}/api/tools/qr`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error(`Worker returned ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    if (!result.success || !result.dataUrl) {
      throw new Error(result.error || 'Failed to generate QR code');
    }

    return result.dataUrl;
  } catch (err) {
    console.error('QR Code generation error:', err);
    throw new Error('Failed to generate QR code.');
  }
}
