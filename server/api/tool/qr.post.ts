import { generateQRCode } from '~~/server/utils/qrcode';

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const text = body.text;

    if (!text) {
        throw createError({
            statusCode: 400,
            statusMessage: 'Text is required',
        });
    }

    try {
        const qrDataUrl = await generateQRCode(text);
        return {
            success: true,
            dataUrl: qrDataUrl,
        };
    } catch (error) {
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to generate QR code',
        });
    }
});
