import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import QRCode from "qrcode";
import type { IAgenda, IDoc, IMember, IPoint } from "~~/types";
import type {
  IConfigResponse,
  IDocResponse,
  IResponse,
} from "~~/types/IResponse";

function monthToRomanFromDate(): string {
  const date = new Date(Date.now());
  let monthNumber = date.getMonth() + 1; // getMonth() returns 0-based index

  let romanNumeral = "";
  const arabicNumbers = [1, 4, 5, 9, 10, 40, 50, 90, 100, 400, 500, 900, 1000];
  const romanSymbols = [
    "I",
    "IV",
    "V",
    "IX",
    "X",
    "XL",
    "L",
    "XC",
    "C",
    "CD",
    "D",
    "CM",
    "M",
  ];
  let i = 12;
  while (monthNumber !== 0) {
    if (arabicNumbers[i]! <= monthNumber) {
      romanNumeral += romanSymbols[i]!;
      monthNumber -= arabicNumbers[i]!;
    } else {
      i--;
    }
  }
  return romanNumeral;
}
export const useMakeDocs = (agenda: IAgenda | undefined) => {
  const config = useRuntimeConfig();
  const { $api } = useNuxtApp();
  const { data: organizers } = useFetch("/api/organizer", {
    transform: (data) => {
      return data.data?.organizers || [];
    },
    lazy: true,
  });
  const { data: user } = useAuth();
  const { data: lastDocNumber } = useAsyncData<IResponse & { data?: number }>(
    () => $api("/api/doc/numbering/last")
  );
  const { data: configdata } = useAsyncData<IConfigResponse>(() =>
    $api("/api/config")
  );

  const organizer = computed(() =>
    organizers.value ? organizers.value[0] : undefined
  );
  const chairman = computed(() =>
    organizer.value?.dailyManagement.find(
      (dm) => dm.position.includes("Ketua") || dm.position.includes("Chairman")
    )
  ).value?.member as IMember;
  const secretary = computed(() =>
    organizer.value?.dailyManagement.find(
      (dm) =>
        dm.position.includes("Sekretaris") || dm.position.includes("Secretary")
    )
  ).value?.member as IMember;
  const member = computed(() => user?.value?.member as unknown as IMember);
  // const pdf = usePDFMake();
  // pdf.fonts = {
  //   Times: {
  //     normal: config.public.public_uri + "/fonts/times-new-roman.ttf",
  //     italics: config.public.public_uri + "/fonts/times-new-roman-italic.ttf",
  //     bold: config.public.public_uri + "/fonts/times-new-roman-bold.ttf",
  //     bolditalics:
  //       config.public.public_uri + "/fonts/times-new-roman-bold-italic.ttf",
  //   },
  // };

  async function generateQRCode(data: string): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
      QRCode.toBuffer(data, { type: "png", width: 200 }, (err, buffer) => {
        if (err) {
          reject(err);
        } else {
          resolve(buffer);
        }
      });
    });
  }

  const makeActivinessLetter = async (data: IPoint) => {
    let response: IDocResponse = {
      statusCode: 500,
      statusMessage: "Failed to generate Activiness Letter",
    };
    // Generate the last document number in the desired format
    const formatDocNumber = (number: number): string => {
      const paddedNumber = number.toString().padStart(4, "0");
      return `${paddedNumber.slice(0, 3)}/${paddedNumber.slice(3)}`;
    };

    const lastNumber = lastDocNumber.value?.data || 0;
    const formattedNumber = formatDocNumber(lastNumber + 1);
    const document_number = `${formattedNumber}/II.3.AI/BO1.01/02.A-1/S.Ket/${monthToRomanFromDate()}/${new Date(
      Date.now()
    ).getFullYear()}`;

    try {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage();

      // Embed fonts (Times New Roman is not a standard PDF-lib font, so we'll use TimesRoman)
      // For Times New Roman, you'd need to embed a .ttf file:
      // const fontBytes = await fetch('/fonts/Times-New-Roman.ttf').then(res => res.arrayBuffer());
      // const timesRomanFont = await pdfDoc.embedFont(fontBytes);
      const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
      const timesRomanItalicFont = await pdfDoc.embedFont(
        StandardFonts.TimesRomanItalic
      );
      const timesRomanBoldFont = await pdfDoc.embedFont(
        StandardFonts.TimesRomanBold
      );

      // Set default font and font size for the page
      page.setFont(timesRomanFont);
      page.setFontSize(12);

      // --- Header Section ---
      const margin = 20;
      const pageWidth = page.getWidth();
      const headerY = page.getHeight() - 50; // Adjust as needed

      // Load images (assuming they are in base64 or can be fetched as ArrayBuffer)
      // In a Nuxt app, you'd fetch them or import them as static assets
      const himaLogoBytes = await fetch("/img/logo.png").then((res) =>
        res.arrayBuffer()
      );
      const itsnuLogoBytes = await fetch("/img/itsnu-logo.png").then((res) =>
        res.arrayBuffer()
      );

      const himaLogo = await pdfDoc.embedPng(himaLogoBytes);
      const itsnuLogo = await pdfDoc.embedPng(itsnuLogoBytes);

      const logoWidth = 60;
      const logoHeight = 60; // Assuming square logos, adjust if not

      // Draw HIMA Logo
      page.drawImage(himaLogo, {
        x: margin,
        y: headerY - logoHeight / 2,
        width: logoWidth,
        height: logoHeight,
      });

      // Draw ITSNU Logo
      page.drawImage(itsnuLogo, {
        x: pageWidth - margin - logoWidth,
        y: headerY - logoHeight / 2,
        width: logoWidth,
        height: logoHeight,
      });

      // Organization Name
      const orgName1 =
        configdata.value?.data.name || "Himpunan Mahasiswa Informatika";
      const orgName2 =
        "INSTITUT TEKNOLOGI DAN SAINS NAHDLATUL ULAMA PEKALONGAN";
      const secretariat = configdata.value?.data.address || "";
      const email = configdata.value?.data.contact.email || "";

      // Calculate text widths to center them between logos
      const orgName1Width = timesRomanBoldFont.widthOfTextAtSize(orgName1, 14);
      const orgName2Width = timesRomanBoldFont.widthOfTextAtSize(orgName2, 12); // Slightly smaller font for second line in original
      const secretariatWidth = timesRomanItalicFont.widthOfTextAtSize(
        secretariat,
        11
      );
      const emailWidth = timesRomanItalicFont.widthOfTextAtSize(email, 11);

      const textStartX = margin + logoWidth + 10; // 10px padding from logo
      const textEndX = pageWidth - margin - logoWidth - 10;
      const textContainerWidth = textEndX - textStartX;

      // Center text in the available space
      page.drawText(orgName1, {
        x: textStartX + (textContainerWidth - orgName1Width) / 2,
        y: headerY,
        font: timesRomanBoldFont,
        size: 14,
        color: rgb(0, 0.5, 0), // Green color
      });
      page.drawText(orgName2, {
        x: textStartX + (textContainerWidth - orgName2Width) / 2,
        y: headerY - 15, // Adjust line spacing
        font: timesRomanBoldFont,
        size: 12, // Original used bold, but 12pt for second line
        color: rgb(0, 0.5, 0), // Green color
      });
      page.drawText(secretariat, {
        x: textStartX + (textContainerWidth - secretariatWidth) / 2,
        y: headerY - 30,
        font: timesRomanItalicFont,
        size: 11,
      });
      page.drawText(email, {
        x: textStartX + (textContainerWidth - emailWidth) / 2,
        y: headerY - 42,
        font: timesRomanItalicFont,
        size: 11,
      });

      // Lines
      const lineY1 = headerY - 55; // Adjust position based on text
      const lineY2 = lineY1 - 5;
      const lineWidth = pageWidth - 2 * margin; // Page width minus margins

      page.drawLine({
        start: { x: margin, y: lineY1 },
        end: { x: margin + lineWidth, y: lineY1 },
        thickness: 1,
        color: rgb(0, 0, 0),
      });
      page.drawLine({
        start: { x: margin, y: lineY2 },
        end: { x: margin + lineWidth, y: lineY2 },
        thickness: 2,
        color: rgb(0, 0, 0),
      });

      // --- Document Title Section ---
      const titleY = lineY2 - 30; // Adjust spacing from lines
      const title1 = "Surat Keterangan Aktif";
      const title2 = "Himpunan Mahasiswa Informatika";
      const docNumberText = document_number;

      page.setFont(timesRomanBoldFont);
      page.setFontSize(14);
      page.drawText(title1, {
        x: (pageWidth - timesRomanBoldFont.widthOfTextAtSize(title1, 14)) / 2,
        y: titleY,
      });

      page.drawText(title2, {
        x: (pageWidth - timesRomanBoldFont.widthOfTextAtSize(title2, 14)) / 2,
        y: titleY - 20, // Line height adjusted
      });
      // pdf-lib doesn't have direct 'underline'. You'll draw a line yourself.
      const title2Width = timesRomanBoldFont.widthOfTextAtSize(title2, 14);
      page.drawLine({
        start: { x: (pageWidth - title2Width) / 2, y: titleY - 22 }, // Adjust for baseline
        end: { x: (pageWidth - title2Width) / 2 + title2Width, y: titleY - 22 },
        thickness: 1,
        color: rgb(0, 0, 0),
      });

      page.setFont(timesRomanFont); // Back to normal font for doc number
      page.setFontSize(12);
      page.drawText(docNumberText, {
        x:
          (pageWidth - timesRomanFont.widthOfTextAtSize(docNumberText, 12)) / 2,
        y: titleY - 40,
      });

      // --- Main Content Section ---
      let currentY = titleY - 60; // Start below the title section

      page.drawText("Yang bertanda tangan di bawah ini : ", {
        x: margin + 20, // Margin from your original code was 40, here margin is 20, so +20
        y: currentY,
      });
      currentY -= 20; // Move down

      // Helper function for drawing key-value pairs
      const drawKeyValue = (
        key: string,
        value: string | number,
        y: number,
        font = timesRomanFont,
        size = 12
      ) => {
        const startX = margin + 20;
        const keyWidth = 90; // From original code
        page.drawText(key, { x: startX, y, font, size });
        page.drawText(":", { x: startX + keyWidth, y, font, size });
        page.drawText(value.toString(), {
          x: startX + keyWidth + 10,
          y,
          font,
          size,
        }); // 10px for the colon
      };

      currentY -= 15;
      drawKeyValue("Nama", chairman?.fullName, currentY);
      currentY -= 15;
      drawKeyValue("NIM", chairman.NIM, currentY);
      currentY -= 15;
      drawKeyValue("Jabatan", "Ketua Umum", currentY);

      currentY -= 30; // Margin from original
      page.drawText("Menyatakan dengan sesungguhnya bahwa :", {
        x: margin + 20,
        y: currentY,
      });

      currentY -= 15;
      drawKeyValue("Nama", member?.value.fullName, currentY);
      currentY -= 15;
      drawKeyValue("NIM", member?.value.NIM, currentY);
      currentY -= 15;
      drawKeyValue("Kelas", member?.value.class, currentY);
      currentY -= 15;
      drawKeyValue("Semester", data.semester, currentY);
      currentY -= 30; // Margin from original

      const periodStartYear = new Date(data.range.start).getFullYear();
      const periodEndYear = new Date(data.range.end).getFullYear();
      const activeStatement = `Adalah mahasiswa yang benar - benar aktif dalam Himpunan Mahasiswa Informatika (HIMATIKA) ITSNU Pekalongan periode ${periodStartYear}/${periodEndYear}.`;
      page.drawText(activeStatement, {
        x: margin + 20,
        y: currentY,
        maxWidth: pageWidth - 2 * (margin + 20), // Ensure text wraps within content area
      });
      currentY -= timesRomanFont.heightAtSize(12) * 2; // Estimate line height for two lines

      currentY -= 20;
      const closingStatement =
        "Demikian surat keterangan keaktifan mahasiswa ini dibuat sebagaimana mestinya.";
      page.drawText(closingStatement, {
        x: margin + 20,
        y: currentY,
        maxWidth: pageWidth - 2 * (margin + 20),
        lineHeight: 1.2,
      });
      currentY -= timesRomanFont.heightAtSize(12);

      // --- Footer Section ---
      currentY -= 30; // Margin from original
      const currentDate = new Date().toLocaleDateString("id-ID", {
        dateStyle: "long",
      });
      const cityDateText = `Pekalongan, ${currentDate}`;
      page.drawText(cityDateText, {
        x:
          pageWidth -
          margin -
          timesRomanFont.widthOfTextAtSize(cityDateText, 12),
        y: currentY,
      });
      currentY -= 30;

      const orgFooterText = [
        "HIMPUNAN MAHASISWA INFORMATIKA",
        "INSTITUT TEKNOLOGI DAN SAINS NAHDLATUL ULAMA",
        "PEKALONGAN",
      ];
      page.setFont(timesRomanBoldFont);
      orgFooterText.forEach((line) => {
        page.drawText(line, {
          x: (pageWidth - timesRomanBoldFont.widthOfTextAtSize(line, 12)) / 2,
          y: currentY,
        });
        currentY -= 15; // Adjust line spacing
      });

      currentY -= 20; // Margin from original
      page.drawText("Mengetahui", {
        x:
          (pageWidth - timesRomanBoldFont.widthOfTextAtSize("Mengetahui", 12)) /
          2,
        y: currentY,
      });
      currentY -= 20; // Space for signatures

      // Signature Section (Vertically Centered)
      const signatureY = currentY; // Save the current Y position for signatures
      const signatureSpacing = 15; // Spacing between lines in the signature section
      const chairmanSignatureY =
        signatureY -
        signatureSpacing -
        timesRomanFont.widthOfTextAtSize(`/${chairman.NIM}signature/`, 12); // Height for each signature section
      const secretarySignatureY =
        signatureY -
        signatureSpacing -
        timesRomanFont.widthOfTextAtSize(`/${secretary.NIM}signature/`, 12); // Height for each signature section
      // Left (Ketua Umum)
      const leftSignatureX = pageWidth / 4; // Centered in the left quarter of the page
      page.setFont(timesRomanBoldFont);
      page.drawText("Ketua Umum", {
        x:
          leftSignatureX -
          timesRomanBoldFont.widthOfTextAtSize("Ketua Umum", 12) / 2,
        y: signatureY,
      });

      page.setFont(timesRomanFont);
      page.drawText(`/${chairman.NIM}signature/`, {
        x:
          leftSignatureX -
          timesRomanFont.widthOfTextAtSize(`/${chairman.NIM}signature/`, 12) /
            2,
        y: chairmanSignatureY,
        color: rgb(0.5, 0.5, 0.5),
      });

      page.setFont(timesRomanBoldFont);
      page.drawText(chairman.fullName, {
        x:
          leftSignatureX -
          timesRomanBoldFont.widthOfTextAtSize(chairman.fullName, 12) / 2,
        y: chairmanSignatureY - signatureSpacing,
      });
      page.drawLine({
        start: {
          x:
            leftSignatureX -
            timesRomanBoldFont.widthOfTextAtSize(chairman.fullName, 12) / 2,
          y: chairmanSignatureY - signatureSpacing - 2,
        },
        end: {
          x:
            leftSignatureX +
            timesRomanBoldFont.widthOfTextAtSize(chairman.fullName, 12) / 2,
          y: chairmanSignatureY - signatureSpacing - 2,
        },
        thickness: 0.5,
        color: rgb(0, 0, 0),
      });
      page.setFont(timesRomanFont);
      page.drawText(chairman.NIM.toString(), {
        x:
          leftSignatureX -
          timesRomanFont.widthOfTextAtSize(chairman.NIM.toString(), 12) / 2,
        y: chairmanSignatureY - 2 * signatureSpacing,
      });

      // Right (Sekretaris Umum)
      const rightSignatureX = (pageWidth * 3) / 4; // Centered in the right quarter of the page
      page.setFont(timesRomanBoldFont);
      page.drawText("Sekretaris Umum", {
        x:
          rightSignatureX -
          timesRomanBoldFont.widthOfTextAtSize("Sekretaris Umum", 12) / 2,
        y: signatureY,
      });

      page.setFont(timesRomanFont);
      page.drawText(`/${secretary.NIM}signature/`, {
        x:
          rightSignatureX -
          timesRomanFont.widthOfTextAtSize(`/${secretary.NIM}signature/`, 12) /
            2,
        y: secretarySignatureY,
        color: rgb(0.5, 0.5, 0.5),
      });

      page.setFont(timesRomanBoldFont);
      page.drawText(secretary.fullName, {
        x:
          rightSignatureX -
          timesRomanBoldFont.widthOfTextAtSize(secretary.fullName, 12) / 2,
        y: secretarySignatureY - signatureSpacing,
      });
      page.drawLine({
        start: {
          x:
            rightSignatureX -
            timesRomanBoldFont.widthOfTextAtSize(secretary.fullName, 12) / 2,
          y: secretarySignatureY - signatureSpacing - 2,
        },
        end: {
          x:
            rightSignatureX +
            timesRomanBoldFont.widthOfTextAtSize(secretary.fullName, 12) / 2,
          y: secretarySignatureY - signatureSpacing - 2,
        },
        thickness: 0.5,
        color: rgb(0, 0, 0),
      });
      page.setFont(timesRomanFont);
      page.drawText(secretary.NIM.toString(), {
        x:
          rightSignatureX -
          timesRomanFont.widthOfTextAtSize(secretary.NIM.toString(), 12) / 2,
        y: secretarySignatureY - 2 * signatureSpacing,
      });

      const notes1 =
        "*Surat ini dibuat dengan menggunakan sistem informasi Himpunan Mahasiswa Informatika (HIMATIKA) ITSNU Pekalongan. dan ditandatangani secara elektronik. Surat ini sah dan berlaku sebagai bukti keaktifan mahasiswa dalam organisasi.";
      const notes2 =
        "*Untuk verifikasi keaslian surat ini, silakan kunjungi: " +
        config.public.public_uri +
        "/signatures/scan";
      const notesX = margin + 20;
      const notesY = secretarySignatureY - 3 * signatureSpacing - 20; // Adjust position above signatures
      page.setFont(timesRomanItalicFont);
      page.setFontSize(10);
      page.drawText(notes1, {
        x: notesX,
        y: notesY,
        maxWidth: pageWidth - 2 * notesX, // Ensure text wraps within content area
      });
      page.drawText(notes2, {
        x: notesX,
        y: notesY - 15, // Adjust line height
        maxWidth: pageWidth - 2 * notesX, // Ensure text wraps within content area
      });
      // --- End of Page 1 ---
      // Add a new page for the second page of the document
      const page2 = pdfDoc.addPage();
      // Set the same font and size for the second page
      page2.setFont(timesRomanFont);
      page2.setFontSize(12);
      // Draw the same header on the second page
      page2.drawImage(himaLogo, {
        x: margin,
        y: page2.getHeight() - margin - logoHeight,
        width: logoWidth,
        height: logoHeight,
      });
      page2.drawImage(itsnuLogo, {
        x: page2.getWidth() - margin - logoWidth,
        y: page2.getHeight() - margin - logoHeight,
        width: logoWidth,
        height: logoHeight,
      });
      // Draw the same organization name and contact information on the second page
      page2.drawText(orgName1, {
        x: textStartX + (textContainerWidth - orgName1Width) / 2,
        y: headerY,
        font: timesRomanBoldFont,
        size: 14,
        color: rgb(0, 0.5, 0), // Green color
      });
      page2.drawText(orgName2, {
        x: textStartX + (textContainerWidth - orgName2Width) / 2,
        y: headerY - 15, // Adjust line spacing
        font: timesRomanBoldFont,
        size: 12, // Original used bold, but 12pt for second line
        color: rgb(0, 0.5, 0), // Green color
      });
      page2.drawText(secretariat, {
        x: textStartX + (textContainerWidth - secretariatWidth) / 2,
        y: headerY - 30,
        font: timesRomanItalicFont,
        size: 11,
      });
      page2.drawText(email, {
        x: textStartX + (textContainerWidth - emailWidth) / 2,
        y: headerY - 42,
        font: timesRomanItalicFont,
        size: 11,
      });
      // Draw the same lines on the second page
      page2.drawLine({
        start: { x: margin, y: lineY1 },
        end: { x: margin + lineWidth, y: lineY1 },
        thickness: 1,
        color: rgb(0, 0, 0),
      });
      page2.drawLine({
        start: { x: margin, y: lineY2 },
        end: { x: margin + lineWidth, y: lineY2 },
        thickness: 2,
        color: rgb(0, 0, 0),
      });
      page2.setFont(timesRomanItalicFont);

      // Draw the same document title on the second page
      page2.drawText("lampiran", {
        x: margin,
        y: titleY,
        font: timesRomanItalicFont,
        size: 12,
      });

      page2.setFont(timesRomanFont);

      page2.drawText("Daftar keaktifan mahasiswa :", {
        x: margin + 20,
        y: titleY - 40,
      });

      // Kegiatan Table
      let tableStartY = titleY - 60;
      const tableMargin = 20;
      const tableWidth = page2.getWidth() - 2 * tableMargin;
      const rowHeight = 15;
      const columnWidths = [300, 100]; // Adjust column widths as needed
      // Draw table header
      page2.setFont(timesRomanBoldFont);
      page2.setFontSize(12);
      page2.drawText("Kategori", {
        x: tableMargin,
        y: tableStartY,
        font: timesRomanBoldFont,
        size: 12,
      });
      page2.drawText("Jumlah", {
        x: tableMargin + columnWidths[0]!,
        y: tableStartY,
        font: timesRomanBoldFont,
        size: 12,
      });

      // Draw table separator
      page2.drawLine({
        start: { x: tableMargin, y: tableStartY - 2 },
        end: { x: tableMargin + tableWidth, y: tableStartY - 2 },
        thickness: 1,
        color: rgb(0, 0, 0),
      });
      tableStartY -= rowHeight; // Move down for the first row

      // Draw table rows
      page2.setFont(timesRomanFont);
      page2.setFontSize(12);

      tableStartY -= rowHeight; // Adjust for header row
      page2.drawText("Panitia Agenda", {
        x: tableMargin,
        y: tableStartY,
        font: timesRomanBoldFont,
        size: 12,
      });
      page2.drawText(data.activities.agendas.committees.toString(), {
        x: tableMargin + columnWidths[0]!,
        y: tableStartY,
      });

      tableStartY -= rowHeight; // Move down for the next row
      page2.drawText("Peserta Agenda", {
        x: tableMargin,
        y: tableStartY,
        font: timesRomanBoldFont,
        size: 12,
      });
      page2.drawText(data.activities.agendas.participants.toString(), {
        x: tableMargin + columnWidths[0]!,
        y: tableStartY,
      });

      tableStartY -= rowHeight; // Move down for the next row
      page2.drawText("Proyek", {
        x: tableMargin,
        y: tableStartY,
        font: timesRomanBoldFont,
        size: 12,
      });
      page2.drawText(data.activities.projects.toString(), {
        x: tableMargin + columnWidths[0]!,
        y: tableStartY,
      });

      tableStartY -= rowHeight; // Move down for the next row
      page2.drawText("Aspirasi", {
        x: tableMargin,
        y: tableStartY,
        font: timesRomanBoldFont,
        size: 12,
      });
      page2.drawText(data.activities.aspirations.toString(), {
        x: tableMargin + columnWidths[0]!,
        y: tableStartY,
      });

      // Serialize the PDFDocument to bytes (a Uint8Array)
      const dataUrl = await pdfDoc.saveAsBase64({
        dataUri: true,
      });
      if (!dataUrl) {
        throw new Error("failed_generate_pdf");
      }

      const docData: IDoc = {
        label: `Surat Keterangan Aktif ${user?.value?.member.NIM} Semester ${data.semester}`,
        no: document_number,
        doc: {
          name: `Surat Keterangan Aktif ${user?.value?.member.NIM} Semester ${data.semester}.pdf`,
          content: dataUrl,
          type: "application/pdf",
          size: dataUrl.length.toString(),
          lastModified: new Date().getTime().toString(),
        },
        tags: ["Surat Keterangan Aktif", `Semester ${data.semester}`],
        archived: false,
        signs: [
          {
            user: (
              organizer.value?.dailyManagement.find(
                (dm) =>
                  dm.position.includes("Ketua") ||
                  dm.position.includes("Chairman")
              )?.member as IMember
            ).NIM,
            signed: false,
            as: "Ketua Umum",
          },
          {
            user: (
              organizer.value?.dailyManagement.find(
                (dm) =>
                  dm.position.includes("Sekretaris") ||
                  dm.position.includes("Secretary")
              )?.member as IMember
            ).NIM,
            signed: false,
            as: "Sekretaris Umum",
          },
        ],
      };
      const ress = await $api<IDocResponse>("/api/doc", {
        method: "post",
        body: docData,
      });
      if (ress.statusCode === 200) {
        return ress.data;
      } else {
        throw new Error("failed_generate_doc");
      }
    } catch (error) {
      throw error;
    }
  };
  const makeAgendaPrecenceWithQRCode = async () => {
    if (!agenda) {
      return {
        statusCode: 500,
        statusMessage: "Agenda not found",
      };
    }

    let response: IDocResponse = {
      statusCode: 500,
      statusMessage: "Failed to generate Agenda Presence Letter",
    };

    try {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595.28, 841.89]); // A4 size in points
      const { width, height } = page.getSize();
      const margin = 40;

      // Embed fonts
      const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
      const timesRomanBoldFont = await pdfDoc.embedFont(
        StandardFonts.TimesRomanBold
      );
      const timesRomanItalicFont = await pdfDoc.embedFont(
        StandardFonts.TimesRomanItalic
      );

      // Embed images
      const himaLogoBytes = await fetch(
        config.public.public_uri + "/img/logo.png"
      ).then((res) => res.arrayBuffer());
      const itsnuLogoBytes = await fetch(
        config.public.public_uri + "/img/itsnu-logo.png"
      ).then((res) => res.arrayBuffer());
      const himaLogo = await pdfDoc.embedPng(himaLogoBytes);
      const itsnuLogo = await pdfDoc.embedPng(itsnuLogoBytes);

      // Draw header
      const logoWidth = 60;
      const logoHeight = 60;
      page.drawImage(himaLogo, {
        x: margin,
        y: height - margin - logoHeight,
        width: logoWidth,
        height: logoHeight,
      });
      page.drawImage(itsnuLogo, {
        x: width - margin - logoWidth,
        y: height - margin - logoHeight,
        width: logoWidth,
        height: logoHeight,
      });

      const headerText = [
        {
          text: "HIMPUNAN MAHASISWA INFORMATIKA",
          font: timesRomanBoldFont,
          size: 14,
          color: rgb(0, 0.5, 0),
        },
        {
          text: "INSTITUT TEKNOLOGI DAN SAINS NAHDLATUL ULAMA PEKALONGAN",
          font: timesRomanBoldFont,
          size: 12,
          color: rgb(0, 0.5, 0),
        },
        {
          text: "Sekretariat : Gedung ITS NU Jl. Karangdowo No. 9 Kedungwuni Pekalongan 51173",
          font: timesRomanItalicFont,
          size: 11,
        },
        {
          text: "email : him.tekom123@gmail.com",
          font: timesRomanItalicFont,
          size: 11,
        },
      ];

      let currentY = height - margin - logoHeight - 20;
      headerText.forEach(({ text, font, size, color }) => {
        const textWidth = font.widthOfTextAtSize(text, size);
        page.drawText(text, {
          x: (width - textWidth) / 2,
          y: currentY,
          font,
          size,
          color: color || rgb(0, 0, 0),
        });
        currentY -= size + 5;
      });

      // Draw lines
      page.drawLine({
        start: { x: margin, y: currentY },
        end: { x: width - margin, y: currentY },
        thickness: 1,
      });
      currentY -= 5;
      page.drawLine({
        start: { x: margin, y: currentY },
        end: { x: width - margin, y: currentY },
        thickness: 2,
      });
      currentY -= 20;

      // Draw content
      const content = [
        { key: "Nama", value: agenda.title },
        {
          key: "Tanggal",
          value:
            new Date(agenda.date.start as string).toLocaleDateString("id-ID", {
              dateStyle: "full",
            }) !==
            new Date(agenda.date.end as string).toLocaleDateString("id-ID", {
              dateStyle: "full",
            })
              ? `${new Date(agenda.date.start as string).toLocaleDateString(
                  "id-ID",
                  {
                    dateStyle: "full",
                  }
                )} - ${new Date(agenda.date.end as string).toLocaleDateString(
                  "id-ID",
                  { dateStyle: "full" }
                )}`
              : new Date(agenda.date.start as string).toLocaleDateString(
                  "id-ID",
                  { dateStyle: "full" }
                ),
        },
        {
          key: "Waktu",
          value: `${new Date(agenda.date.start as string).toLocaleTimeString(
            "id-ID",
            { timeStyle: "short" }
          )} - ${new Date(agenda.date.end as string).toLocaleTimeString(
            "id-ID",
            { timeStyle: "short" }
          )}`,
        },
        { key: "Tempat", value: agenda.at },
      ];

      page.drawText("Dengan ini kami mengagendakan acara :", {
        x: margin,
        y: currentY,
        font: timesRomanFont,
        size: 12,
      });
      currentY -= 20;

      content.forEach(({ key, value }) => {
        page.drawText(`${key} : ${value}`, {
          x: margin,
          y: currentY,
          font: timesRomanFont,
          size: 12,
        });
        currentY -= 15;
      });

      currentY -= 20;
      page.drawText(
        "Untuk itu, untuk memudahkan kehadiran peserta, kami mohon untuk melakukan scan QR Code berikut :",
        {
          x: margin,
          y: currentY,
          font: timesRomanFont,
          size: 12,
        }
      );
      currentY -= 100;

      // Draw QR Code
      const qrCode = await pdfDoc.embedPng(
        await generateQRCode(agenda._id as string)
      ); // Replace with your QR code generation logic
      const qrSize = 100;
      page.drawImage(qrCode, {
        x: (width - qrSize) / 2,
        y: currentY - qrSize,
        width: qrSize,
        height: qrSize,
      });

      currentY -= qrSize + 20;
      page.drawText(
        `Pekalongan, ${new Date().toLocaleDateString("id-ID", {
          dateStyle: "long",
        })}`,
        {
          x: width - margin - 200,
          y: currentY,
          font: timesRomanFont,
          size: 12,
        }
      );

      // Serialize the PDFDocument to bytes (a Uint8Array)
      const pdfBytes = await pdfDoc.saveAsBase64({ dataUri: true });

      // Prepare document data
      const docData: IDoc = {
        label: `Agenda ${agenda.title} QR Code`,
        no: `019/II.3.AI/BO1.01/02.A-1/S.Ket/IV/${new Date().getFullYear()}`,
        doc: {
          name: `Agenda ${agenda.title} QR Code.pdf`,
          content: pdfBytes,
          type: "application/pdf",
          size: pdfBytes.length.toString(),
          lastModified: new Date().getTime().toString(),
        },
        tags: ["Agenda", "QR Code", "HIMATIKA"],
        archived: false,
        signs: [
          {
            user: (
              organizer.value?.dailyManagement.find(
                (dm) =>
                  dm.position.includes("Ketua") ||
                  dm.position.includes("Chairman")
              )?.member as IMember
            ).NIM,
            signed: false,
            as: "Ketua Umum",
          },
        ],
      };

      // Send document data to API
      const ress = await $api<IDocResponse>(`/api/agenda/${agenda._id}/doc`, {
        method: "post",
        body: docData,
      });

      if (ress.statusCode === 200) {
        response = ress;
      }
    } catch (error) {
      throw error;
    }

    return response;
  };
  return {
    makeActivinessLetter,
    makeAgendaPrecenceWithQRCode,
  };
};
