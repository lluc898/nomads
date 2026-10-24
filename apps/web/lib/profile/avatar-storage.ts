import { PROFILE_PHOTO_MAX_BYTES } from "@viajeroshub/shared";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp, { type Metadata } from "sharp";

const storedAvatarPattern = /^\/media\/avatars\/([a-f0-9-]{36}\.webp)$/;
const acceptedFormats = new Set(["jpeg", "png", "webp"]);

export class ProfilePhotoError extends Error {}

export async function storeProfilePhoto(file: File) {
  if (file.size === 0) {
    throw new ProfilePhotoError("Selecciona una foto.");
  }

  if (file.size > PROFILE_PHOTO_MAX_BYTES) {
    throw new ProfilePhotoError("La foto no puede superar los 5 MB.");
  }

  const input = Buffer.from(await file.arrayBuffer());
  const pipeline = sharp(input, {
    failOn: "error",
    limitInputPixels: 40_000_000,
  });

  let metadata: Metadata;

  try {
    metadata = await pipeline.metadata();
  } catch {
    throw new ProfilePhotoError(
      "No hemos podido leer la foto. Usa JPEG, PNG o WebP.",
    );
  }

  if (
    !metadata.format ||
    !acceptedFormats.has(metadata.format) ||
    !metadata.width ||
    !metadata.height
  ) {
    throw new ProfilePhotoError("La foto debe ser JPEG, PNG o WebP.");
  }

  let output: Buffer;

  try {
    output = await pipeline
      .rotate()
      .resize(512, 512, { fit: "cover", position: "centre" })
      .webp({ quality: 82, effort: 4 })
      .toBuffer();
  } catch {
    throw new ProfilePhotoError("No hemos podido procesar la foto.");
  }

  const filename = `${randomUUID()}.webp`;
  const storageDirectory = getAvatarStorageDirectory();
  await mkdir(storageDirectory, { recursive: true });
  await writeFile(path.join(storageDirectory, filename), output, {
    flag: "wx",
  });

  return `/media/avatars/${filename}`;
}

export async function readStoredProfilePhoto(filename: string) {
  if (!isStoredAvatarFilename(filename)) {
    return null;
  }

  try {
    return await readFile(
      path.join(
        /* turbopackIgnore: true */ getAvatarStorageDirectory(),
        filename,
      ),
    );
  } catch (error) {
    if (isFileNotFoundError(error)) {
      return null;
    }
    throw error;
  }
}

export async function deleteStoredProfilePhoto(imageUrl: string | null) {
  const match = imageUrl?.match(storedAvatarPattern);

  if (!match?.[1]) {
    return;
  }

  try {
    await unlink(
      path.join(
        /* turbopackIgnore: true */ getAvatarStorageDirectory(),
        match[1],
      ),
    );
  } catch (error) {
    if (!isFileNotFoundError(error)) {
      throw error;
    }
  }
}

function getAvatarStorageDirectory() {
  return (
    process.env.AVATAR_STORAGE_DIR ??
    path.join(process.cwd(), ".data", "avatars")
  );
}

function isStoredAvatarFilename(filename: string) {
  return /^[a-f0-9-]{36}\.webp$/.test(filename);
}

function isFileNotFoundError(error: unknown): error is NodeJS.ErrnoException {
  return (
    error instanceof Error &&
    "code" in error &&
    (error as NodeJS.ErrnoException).code === "ENOENT"
  );
}
