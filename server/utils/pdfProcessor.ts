import { PutObjectCommand } from "@aws-sdk/client-s3";
import { toDataURL } from "qrcode";
import { IOverlayLocation } from "~~/types";
/**
 * Analyzes a PDF buffer to extract its text content.
 * This is useful for validation or indexing but not for finding coordinates.
 * @param pdfBuffer The PDF file content as a Buffer.
 * @returns A promise that resolves with the extracted text of the PDF.
 */
export async function getPdfText(pdfBuffer: Buffer): Promise<string> {
  try {
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: pdfBuffer });
    const data = await parser.getText();
    return data.text;
  } catch (error) {
    console.error("Error parsing PDF for text extraction:", error);
    throw new Error("Failed to parse PDF.");
  }
}

/**
 * Overlays a QR code onto a PDF at specified locations and saves it to Vercel Blob.
 *
 * @param pdfBuffer The buffer of the input PDF file.
 * @param outputBlobPath The desired path for the output file in Vercel Blob (e.g., "documents/processed.pdf").
 * @param qrValue The string value to encode in the QR code.
 * @param locations An array of IOverlayLocation objects specifying where to draw the QR codes.
 * @returns A promise that resolves with the public URL of the saved PDF in Vercel Blob.
 */
export async function overlayQRAndSavePdf(
  pdf: string,
  outputBlobPath: string,
  qrValue: string,
  locations: IOverlayLocation[]
): Promise<string> {
  try {
    const { PDFDocument } = await import("pdf-lib");
    const pdfFetch = await fetch(pdf);
    const pdfBuffer = await pdfFetch.arrayBuffer();
    // Load the PDF document from the buffer
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pages = pdfDoc.getPages();

    // Generate the QR code image as a Data URL
    const qrImageDataUrl = await toDataURL(qrValue, {
      errorCorrectionLevel: "H",
      type: "image/png",
      margin: 1,
    });

    // Embed the QR code image into the PDF document
    const qrImage = await pdfDoc.embedPng(qrImageDataUrl);

    // Draw the QR code image at each specified location
    for (const location of locations) {
      if (location.page < 1 || location.page > pages.length) {
        console.warn(`Invalid page number ${location.page}. Skipping.`);
        continue;
      }
      const page = pages[location.page - 1]; // Page array is 0-based
      const yCoordForPdfLib = page.getHeight() - (location.y + location.height); // Sesuaikan ini!

      page.drawImage(qrImage, {
        x: location.x,
        y: yCoordForPdfLib + 8,
        width: location.width,
        height: location.width,
      });
    }

    // Save the modified PDF to a Uint8Array
    const pdfBytes = await pdfDoc.save();

    if (!pdfBytes || pdfBytes.length === 0) {
      throw new Error("Failed to generate PDF bytes.");
    }

    const buffer = Buffer.from(pdfBytes);
    // Upload the resulting PDF buffer to R2 Cloudflare
    await r2Client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: outputBlobPath,
        Body: buffer,
        ContentType: "application/pdf",
      })
    );

    return `${R2_PUBLIC_DOMAIN}/${outputBlobPath}`;
  } catch (error) {
    console.error("Error overlaying QR code and saving PDF:", error);
    throw new Error("A problem occurred during the PDF modification process.");
  }
}
