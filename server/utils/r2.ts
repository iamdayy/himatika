import { S3Client } from "@aws-sdk/client-s3";

const config = useRuntimeConfig();

export const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${config.r2_bucket_name}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: config.r2_access_key_id || "",
    secretAccessKey: config.r2_secret_access_key || "",
  },
});

export const R2_BUCKET_NAME = config.r2_bucket_name || "";
export const R2_PUBLIC_DOMAIN = config.r2_public_domain || "";
