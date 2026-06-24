/**
 * Composable for uploading large files directly to R2 using presigned URLs.
 * This bypasses the server's payload size limit by uploading directly from the browser.
 */
export interface PresignedUploadState {
  progress: Ref<number>;
  uploading: Ref<boolean>;
  error: Ref<string | null>;
  upload: (file: File, agendaId: string) => Promise<{ fileKey: string } | null>;
  abort: () => void;
}

export const usePresignedUpload = (): PresignedUploadState => {
  const { $api } = useNuxtApp();
  const progress = ref(0);
  const uploading = ref(false);
  const error = ref<string | null>(null);
  let currentXhr: XMLHttpRequest | null = null;

  const upload = async (file: File, agendaId: string): Promise<{ fileKey: string } | null> => {
    progress.value = 0;
    uploading.value = true;
    error.value = null;

    try {
      // Step 1: Get presigned URL from backend
      const presignedResponse = await $api<{
        statusCode: number;
        statusMessage: string;
        data?: { uploadUrl: string; fileKey: string };
      }>("/api/storage/presigned-url", {
        method: "POST",
        body: {
          fileName: file.name,
          contentType: file.type,
          agendaId,
          fileSize: file.size,
        },
      });

      if (!presignedResponse?.data?.uploadUrl || !presignedResponse?.data?.fileKey) {
        throw new Error(presignedResponse?.statusMessage || "Failed to get presigned URL");
      }

      const { uploadUrl, fileKey } = presignedResponse.data;

      // Step 2: Upload directly to R2 using XMLHttpRequest for progress tracking
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        currentXhr = xhr;

        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            progress.value = Math.round((event.loaded / event.total) * 100);
          }
        });

        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            progress.value = 100;
            resolve();
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        });

        xhr.addEventListener("error", () => {
          reject(new Error("Network error during upload"));
        });

        xhr.addEventListener("abort", () => {
          reject(new Error("Upload was cancelled"));
        });

        xhr.open("PUT", uploadUrl, true);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.send(file);
      });

      currentXhr = null;
      return { fileKey };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Upload failed";
      error.value = errMsg;
      console.error("Presigned upload error:", err);
      return null;
    } finally {
      uploading.value = false;
    }
  };

  const abort = () => {
    if (currentXhr) {
      currentXhr.abort();
      currentXhr = null;
      uploading.value = false;
      error.value = "Upload cancelled";
    }
  };

  return {
    progress,
    uploading,
    error,
    upload,
    abort,
  };
};
