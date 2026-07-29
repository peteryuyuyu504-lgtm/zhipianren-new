import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

function getR2Config() {
  const endpoint = process.env.R2_ENDPOINT?.trim();
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim();
  const bucket = process.env.R2_BUCKET_NAME?.trim();
  const publicUrl = process.env.R2_PUBLIC_URL?.trim().replace(/\/+$/, "");

  if (!endpoint || !accessKeyId || !secretAccessKey || !bucket || !publicUrl) {
    throw new Error("Cloudflare R2 environment variables are incomplete");
  }

  return { endpoint, accessKeyId, secretAccessKey, bucket, publicUrl };
}

let s3Client: S3Client | undefined;

// 上传文件到 R2，并返回文件的永久公开链接
export async function uploadToR2(
  fileBuffer: Buffer,
  fileName: string,
  contentType: string,
): Promise<string> {
  const config = getR2Config();
  s3Client ??= new S3Client({
    region: "auto",
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  await s3Client.send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: fileName,
      Body: fileBuffer,
      ContentType: contentType,
    }),
  );

  return `${config.publicUrl}/${fileName}`;
}
