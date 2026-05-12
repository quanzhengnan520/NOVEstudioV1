import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { env } from "../config/env.js";

let s3: S3Client | null = null;

function getS3(): S3Client | null {
  if (!env.r2AccountId || !env.r2AccessKeyId || !env.r2SecretAccessKey || !env.r2Bucket) return null;
  if (!s3) {
    s3 = new S3Client({
      region: "auto",
      endpoint: `https://${env.r2AccountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.r2AccessKeyId,
        secretAccessKey: env.r2SecretAccessKey,
      },
      forcePathStyle: true,
    });
  }
  return s3;
}

function guessContentType(url: string): string {
  const u = url.toLowerCase();
  if (u.includes(".mp4")) return "video/mp4";
  if (u.includes(".webm")) return "video/webm";
  if (u.includes(".png")) return "image/png";
  if (u.includes(".jpg") || u.includes(".jpeg")) return "image/jpeg";
  return "application/octet-stream";
}

/** Download from provider URL and upload to R2; returns public URL or original if R2 not configured. */
export async function rehostRemoteUrlToR2(objectKey: string, sourceUrl: string): Promise<string> {
  const client = getS3();
  if (!client || !env.r2PublicUrl) return sourceUrl;
  const max = Math.max(1024, env.r2MaxDownloadBytes);
  const res = await fetch(sourceUrl);
  if (!res.ok) return sourceUrl;
  const cl = res.headers.get("content-length");
  if (cl && Number(cl) > max) {
    return sourceUrl;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length > max) {
    return sourceUrl;
  }
  await client.send(
    new PutObjectCommand({
      Bucket: env.r2Bucket,
      Key: objectKey,
      Body: buf,
      ContentType: guessContentType(sourceUrl),
    }),
  );
  const base = env.r2PublicUrl.replace(/\/$/, "");
  return `${base}/${objectKey}`;
}
