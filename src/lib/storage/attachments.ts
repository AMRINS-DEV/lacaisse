import { randomInt } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { execute } from "@/lib/db";

export const ALLOWED_UPLOAD_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;

function generateUniqueNumericFileName() {
  return `${Date.now()}${randomInt(100000, 999999)}`;
}

export function validateAttachmentFile(fileEntry: File): string | null {
  if (!fileEntry.name || fileEntry.size <= 0) {
    return "Fichier vide";
  }

  if (!ALLOWED_UPLOAD_MIME_TYPES.has(fileEntry.type)) {
    return "Type invalide. Utilisez PDF, JPG, PNG, WEBP ou GIF.";
  }

  if (fileEntry.size > MAX_UPLOAD_SIZE_BYTES) {
    return "Fichier trop volumineux (max 10 MB).";
  }

  return null;
}

export async function storeAttachmentFileLocally(fileEntry: File, userId: number) {
  const storedFileName = generateUniqueNumericFileName();
  const uploadDir = join(process.cwd(), "public", "uploads", "recettes");
  await mkdir(uploadDir, { recursive: true });

  const bytes = Buffer.from(await fileEntry.arrayBuffer());
  await writeFile(join(uploadDir, storedFileName), bytes);

  const path = `/uploads/recettes/${storedFileName}`;
  const { insertId } = await execute(
    `INSERT INTO attachments (original_name, mime_type, size_bytes, path, uploaded_by)
     VALUES (?, ?, ?, ?, ?)`,
    [storedFileName, fileEntry.type, fileEntry.size, path, userId]
  );

  return {
    id: Number(insertId),
    originalName: storedFileName,
    mimeType: fileEntry.type,
    sizeBytes: fileEntry.size,
    path,
  };
}
