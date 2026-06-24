import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { r2Client, R2_BUCKET_NAME, R2_PUBLIC_DOMAIN } from "./r2";

/**
 * Standardized folder paths for cloud storage uploads.
 * Use these constants to ensure consistent directory structures without double slashes.
 */
export const StoragePaths = {
  AVATARS: "uploads/avatars",
  NEWS: "uploads/news",
  PROJECTS: (id?: string) => id ? `uploads/projects/${id}/photos` : "uploads/projects",
  AGENDAS: (id: string, type: 'photos' | 'videos' | 'docs' | 'payments' | 'answers', suffix?: string) =>
    `uploads/agendas/${id}/${type}${suffix ? `/${suffix}` : ''}`,
  ASPIRATIONS: (id: string, type: 'photos' | 'videos' | 'docs') =>
    `uploads/aspirations/${id}/${type}`,
  ACHIEVEMENTS: (memberId: string) => `uploads/achievements/${memberId}/proofs`,
  CAROUSELS: "uploads/carousels",
  ORGANIZERS: "uploads/organizers",
  SIGNATURES: "uploads/signatures",
  DOCS: "uploads/docs"
} as const;

/**
 * Extracts the full S3 Key from a public URL.
 * It removes the base domain (R2_PUBLIC_DOMAIN) and handles leading slashes.
 * @param url Full public URL string
 * @returns The exact S3 Key needed for DeleteObjectCommand
 */
export const extractKeyFromUrl = (url: string): string => {
  if (!url) return "";
  try {
    const parsedUrl = new URL(url);
    // Return path without leading slash
    return parsedUrl.pathname.substring(1);
  } catch (e) {
    // Fallback if not a valid URL
    const cleanDomain = R2_PUBLIC_DOMAIN.replace(/\/$/, "");
    if (url.startsWith(cleanDomain)) {
      let key = url.replace(cleanDomain, "");
      if (key.startsWith('/')) key = key.substring(1);
      return key;
    }
    // If we can't parse it, just return the filename to avoid catastrophic failure
    return url.split("/").pop() || url;
  }
};

/**
 * Uploads a file buffer to R2 Storage securely.
 * @param file The file object containing .data, .name, and .type
 * @param folderPath The target folder string (no leading/trailing slashes ideally)
 * @returns The full public URL of the uploaded file
 */
export const uploadToR2 = async (file: any, folderPath: string): Promise<string> => {
  if (!file || typeof file === 'string' || !file.data) {
    throw new Error("Invalid file object provided for upload");
  }

  // Clean the folder path (remove leading/trailing slashes)
  const cleanPath = folderPath.replace(/^\/+|\/+$/g, '');
  const fileExt = file.type?.split("/")[1] || "bin";

  // Create a clean filename avoiding spaces or special characters
  const safeOriginalName = (file.name || "upload").replace(/[^a-zA-Z0-9.-]/g, "_");
  const timestamp = Date.now();
  const key = `${cleanPath}/${timestamp}_${safeOriginalName}`;

  await r2Client.send(
    new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: file.data,
      ContentType: file.type || "application/octet-stream",
    })
  );

  const cleanDomain = R2_PUBLIC_DOMAIN.replace(/\/$/, "");
  return `${cleanDomain}/${key}`;
};

/**
 * Deletes an object from R2 Storage using its public URL.
 * Safely ignores errors if the file doesn't exist.
 * @param fileUrl The full public URL stored in the database
 */
export const deleteFromR2 = async (fileUrl: string | undefined): Promise<void> => {
  if (!fileUrl) return;

  const key = extractKeyFromUrl(fileUrl);
  if (!key) return;

  try {
    await r2Client.send(
      new DeleteObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
      })
    );
  } catch (error) {
    console.error(`Failed to delete S3 object: ${key}`, error);
    // We don't throw because failing to delete a file shouldn't break the database deletion flow
  }
};
