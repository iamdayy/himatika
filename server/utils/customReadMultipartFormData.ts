import {
  EventHandlerRequest,
  H3Event,
  createError,
  getRequestHeader,
  readMultipartFormData,
} from "h3";

/**
 * Mendefinisikan struktur objek file yang akan kita buat.
 */
export interface ParsedFile {
  name?: string;
  data: Buffer;
  type?: string;
}

interface CompressionOptions {
  quality?: number; // Kualitas output (1-100), default: 80
  maxWidth?: number; // Lebar maksimum (resize proporsional)
  maxHeight?: number; // Tinggi maksimum (resize proporsional)
}

interface UploadOptions {
  // --- LIMITS ---
  maxTotalSize?: number; // Batas total ukuran request (bytes)
  maxFileSize?: number; // Batas ukuran per file (bytes)
  allowedTypes?: string[]; // Array mime types yang diizinkan

  // --- COMPRESSION ---
  /**
   * Opsi kompresi. Jika diisi, sistem akan mencoba mengompres gambar.
   * Hanya berlaku untuk file tipe image (jpeg, png, webp, avif, tiff).
   */
  compress?: CompressionOptions;
}

/**
 * Membaca multipart form data dengan validasi ukuran dan kompresi gambar otomatis.
 * * Default Limits:
 * - Total Request: 10 MB
 * - Per File: 5 MB
 */
export async function customReadMultipartFormData<T>(
  event: H3Event<EventHandlerRequest>,
  options: UploadOptions = {}
): Promise<Partial<Record<keyof T, string | ParsedFile>>> {
  // 1. SETUP DEFAULT LIMITS
  const MAX_TOTAL_SIZE = options.maxTotalSize || 10 * 1024 * 1024; // Default 10MB
  const MAX_FILE_SIZE = options.maxFileSize || 2 * 1024 * 1024; // Default 2MB

  // 2. CHECK CONTENT-LENGTH HEADER (Pertahanan Lapis Pertama)
  const contentLengthHeader = getRequestHeader(event, "content-length");
  if (contentLengthHeader) {
    const contentLength = parseInt(contentLengthHeader);
    if (!isNaN(contentLength) && contentLength > MAX_TOTAL_SIZE) {
      throw createError({
        statusCode: 413,
        statusMessage: "Payload Terlalu Besar",
        message: `Total ukuran unggahan melebihi batas.`,
      });
    }
  }

  // 3. READ DATA
  const multiPartsData = await readMultipartFormData(event);
  const parsedData: Partial<Record<keyof T, string | ParsedFile>> = {};

  if (multiPartsData) {
    for (const data of multiPartsData) {
      if (data.name) {
        const key = data.name as keyof T;

        if (data.filename) {
          // --- VALIDASI DAN PROSES FILE ---

          let fileData = data.data;
          let fileType = data.type;

          // A. Validasi Ukuran Per File (Sebelum Kompresi)
          // Kita cek data mentah dulu untuk mencegah DoS memory
          if (fileData.length > MAX_FILE_SIZE) {
            throw createError({
              statusCode: 413,
              statusMessage: "Berkas Terlalu Besar",
              message: `Berkas '${data.filename}' melebihi batas.`,
            });
          }

          // B. Validasi Tipe File
          if (options.allowedTypes && fileType) {
            if (!options.allowedTypes.includes(fileType)) {
              throw createError({
                statusCode: 415,
                statusMessage: "Tipe Media Tidak Didukung",
                message: `Tipe berkas '${fileType}' tidak diizinkan.`,
              });
            }
          }

          // C. Kompresi Gambar (Jika options.compress ada & file adalah gambar)
          if (options.compress && fileType && fileType.startsWith("image/")) {
            try {
              const config = useRuntimeConfig();
              const workerUrl = config.pdf_worker_api_url || 'http://localhost:5000';
              
              const formData = new FormData();
              const blob = new Blob([fileData as any], { type: fileType });
              formData.append('file', blob, data.filename);
              
              if (options.compress.quality) {
                formData.append('quality', options.compress.quality.toString());
              }
              if (options.compress.maxWidth) {
                formData.append('maxWidth', options.compress.maxWidth.toString());
              }
              if (options.compress.maxHeight) {
                formData.append('maxHeight', options.compress.maxHeight.toString());
              }

              const response = await fetch(`${workerUrl}/api/tools/compress-image`, {
                method: 'POST',
                body: formData,
              });

              if (!response.ok) {
                 console.warn(`[Compression Warning] Worker returned ${response.status}`);
              } else {
                 const result = await response.json();
                 if (result.success && result.data) {
                    // Result data is base64 string
                    fileData = Buffer.from(result.data, 'base64');
                 } else {
                    console.warn(`[Compression Warning] Worker failed: ${result.error}`);
                 }
              }
            } catch (error) {
              console.warn(
                `[Compression Warning] Failed to compress ${data.filename}:`,
                error
              );
              // Jika gagal kompresi, kita biarkan file asli (fallback)
            }
          }


          parsedData[key] = {
            name: data.filename,
            data: fileData, // Buffer (bisa asli atau terkompresi)
            type: fileType,
          };
        } else {
          // Field teks biasa
          const value = data.data.toString("utf8");
          parsedData[key] = value;
        }
      }
    }
  }

  return parsedData;
}
