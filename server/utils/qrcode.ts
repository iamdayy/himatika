import QRCode from 'qrcode'

/**
 * Generates a QR code from a given string.
 * @param text The text to encode in the QR code.
 * @returns A promise that resolves with the QR code as a data URL string.
 */
export const generateQRCode = async (text: string): Promise<string> => {
  try {
    return await QRCode.toDataURL(text)
  } catch (err) {
    console.error(err)
    // Depending on error handling strategy, you might want to throw the error,
    // or return a default/error image URL.
    // For now, we'll re-throw.
    throw new Error('Failed to generate QR code.')
  }
}
