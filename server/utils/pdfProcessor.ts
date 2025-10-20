import { put } from "@vercel/blob";
import { PDFDocument } from "pdf-lib"; // Pastikan pdf-lib sudah terpasang
import * as pdfjs from "pdfjs-dist";
import { toDataURL } from "qrcode";


interface TextLocation {
  text: string;
  page: number;
  x: number; // Koordinat X (dari kiri halaman)
  y: number; // Koordinat Y (dari bawah halaman)
  width: number;
  height: number;
}

export async function findTextCoordinates(
  pdfPath: string,
  searchText: string
): Promise<TextLocation[]> {
  const matchingLocations: TextLocation[] = [];

  try {
    const response = await fetch(pdfPath);
    const arrayBuffer = await response.arrayBuffer();

    // Memuat dokumen PDF dari buffer
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer as ArrayBuffer });
    const pdfDocument = await loadingTask.promise;

    // Iterasi melalui setiap halaman PDF
    for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
      const page = await pdfDocument.getPage(pageNum);
      const textContent = await page.getTextContent();

      // Iterasi melalui setiap item teks di halaman
      for (const item of textContent.items) {
        // Konversi item.item ke any untuk menghindari error tipe jika item.str bukan string
        const textItem = item as any; // Cast ke any untuk akses str dan transform

        if (textItem.str && textItem.str.includes(searchText)) {
          // Mendapatkan transformasi matriks untuk posisi teks
          const transform = textItem.transform;

          // Koordinat (x, y) dari teks item berada di transform [4] dan [5]
          // PDF.js menggunakan sistem koordinat di mana Y=0 adalah di bagian bawah halaman.
          // Jika Anda butuh Y dari atas, Anda perlu menguranginya dari tinggi halaman.
          const viewport = page.getViewport({ scale: 1 }); // Skala 1 untuk koordinat asli PDF

          const x = transform[4];
          const y = viewport.height - transform[5]; // Konversi Y dari bawah ke atas

          matchingLocations.push({
            text: textItem.str,
            page: pageNum,
            x: x,
            y: y,
            width: textItem.width,
            height: textItem.height,
          });
        }
      }
      page.cleanup(true); // Penting untuk membebaskan memori
    }

    return matchingLocations;
  } catch (error) {
    console.error("Error finding text coordinates in PDF:", error);
    throw new Error("Failed to process PDF for text coordinates.");
  }
}

export async function overlayQRAndSavePdf(
  inputPdfPath: string,
  outputPdfPath: string,
  qrValue: string,
  locations: TextLocation[]
) {
  const response = await fetch(inputPdfPath);
  const arrayBuffer = await response.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer as ArrayBuffer);

  const pages = pdfDoc.getPages();
  // Muat semua gambar yang dibutuhkan sekali
  const embeddedImages: { [imagePath: string]: any } = {};
  for (const location of locations) {
    const imageDataUrl = await toDataURL(qrValue, {
      errorCorrectionLevel: "H",
      type: "image/png",
      margin: 0,
      color: {
        dark: "#000000", // Warna gelap untuk QR Code
        light: "#FFFFFF", // Warna terang untuk latar belakang
      },
    });
    if (!embeddedImages[location.text]) {
      const image = await pdfDoc.embedPng(imageDataUrl);
      embeddedImages[location.text] = image;
    }
  }

  for (const location of locations) {
    const page = pages[location.page - 1]; // Halaman array berbasis 0

    // Perlu penyesuaian koordinat: pdf-lib Y=0 juga di bawah.
    // Anda harus konsisten dengan sistem koordinat yang Anda gunakan.
    // Jika Anda sudah konversi Y di pdfjs-dist ke dari atas, gunakan itu.
    // Kalau tidak, gunakan: page.getHeight() - (location.y + location.height)
    const yCoordForPdfLib = page.getHeight() - (location.y + location.height); // Sesuaikan ini!

    page.drawImage(embeddedImages[location.text], {
      x: location.x, // Perlu dihitung ulang
      y: yCoordForPdfLib + 8, // Perlu dihitung ulang
      width: location.width, // Sesuaikan ukuran gambar sesuai kebutuhan
      height: location.width, // Sesuaikan ukuran gambar sesuai kebutuhan
      // Opsi lain seperti opacity, rotate, dll.
    });
  }

  const Uint8Data = await pdfDoc.save();
  if (!Uint8Data || !(Uint8Data instanceof Uint8Array)) {
        throw new Error("failed_generate_pdf");
      }
  const docFile = new File([(Uint8Data as Uint8Array<ArrayBuffer>)], inputPdfPath.split("/").pop() as string, {
        type: "application/pdf",
      });

  const { url } = await put(outputPdfPath, docFile, {
    access: "public",
  });
  return url;
}
