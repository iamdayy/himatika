import { EventHandlerRequest, H3Event } from "h3";
// readMultipartFormData adalah utilitas global di Nuxt 3
// Jika Anda tidak menggunakan Nuxt, Anda mungkin perlu mengimpornya:
// import { readMultipartFormData } from "h3";

/**
 * Mendefinisikan struktur objek file yang akan kita buat.
 * Ini berbeda dari 'MultiPartData' dari h3.
 */
export interface ParsedFile {
  name?: string;
  data: Buffer;
  type?: string;
}

/**
 * Membaca multipart form data dan mem-parsingnya ke objek
 * dengan kunci yang sesuai dengan tipe generik T.
 * * @param event Event H3
 * @returns Promise yang resolve ke objek parsial dari T,
 * di mana nilainya adalah string atau ParsedFile.
 */
export async function customReadMultipartFormData<T>(
  event: H3Event<EventHandlerRequest>
): Promise<Partial<Record<keyof T, string | ParsedFile>>> {
  
  const multiPartsData = await readMultipartFormData(event);

  // Gunakan Partial<Record<keyof T, ...>>
  // Ini berarti "objek yang mungkin berisi beberapa kunci dari T"
  const parsedData: Partial<Record<keyof T, string | ParsedFile>> = {};

  if (multiPartsData) {
    for (const data of multiPartsData) {
      if (data.name) {
        // --- INI PERBAIKAN UTAMANYA ---
        // Kita memberi tahu TypeScript bahwa 'data.name' adalah salah satu kunci (key) dari T.
        const key = data.name as keyof T;

        // Gunakan 'data.filename' untuk mendeteksi file, ini lebih andal daripada 'data.type'
        if (data.filename) {
          // Ini adalah file
          parsedData[key] = {
            name: data.filename,
            data: data.data,
            type: data.type,
          };
        } else {
          // Ini adalah field teks biasa
          const value = data.data.toString("utf8");
          parsedData[key] = value;

          // Jika Anda ingin mencoba mem-parsing JSON seperti di kode Anda yang dikomentari:
          // try {
          //   // Coba parse, jika gagal, biarkan sebagai string
          //   parsedData[key] = JSON.parse(value);
          // } catch (e) {
          //   parsedData[key] = value;
          // }
        }
      }
    }
  }
  
  return parsedData;
}