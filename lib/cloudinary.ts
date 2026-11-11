import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { v2 as cloudinary } from "cloudinary";

export function configureCloudinary() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  return cloudinary;
}

function isCloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );
}

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

/**
 * Stores an image in /public/uploads when Cloudinary is not configured.
 * Intended for local development; use Cloudinary in production.
 */
async function saveImageLocally(file: File, folder: string) {
  const safeFolder = folder.replace(/[^a-z0-9_-]/gi, "") || "clinic";
  const ext = EXTENSIONS[file.type] || "png";
  const fileName = `${randomUUID()}.${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads", safeFolder);

  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, fileName), Buffer.from(await file.arrayBuffer()));

  return {
    url: `/uploads/${safeFolder}/${fileName}`,
    publicId: `local/${safeFolder}/${fileName}`,
  };
}

export async function uploadImage(file: File, folder = "clinic") {
  if (!isCloudinaryConfigured()) {
    return saveImageLocally(file, folder);
  }

  const configured = configureCloudinary();
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;

  const result = await configured.uploader.upload(base64, {
    folder,
    resource_type: "image",
  });

  return {
    url: result.secure_url as string,
    publicId: result.public_id as string,
  };
}
