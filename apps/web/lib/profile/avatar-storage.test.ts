import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import sharp from "sharp";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  deleteStoredProfilePhoto,
  ProfilePhotoError,
  readStoredProfilePhoto,
  storeProfilePhoto,
} from "./avatar-storage";

let storageDirectory: string;

beforeEach(async () => {
  storageDirectory = await mkdtemp(path.join(tmpdir(), "viajeroshub-avatars-"));
  process.env.AVATAR_STORAGE_DIR = storageDirectory;
});

afterEach(async () => {
  delete process.env.AVATAR_STORAGE_DIR;
  await rm(storageDirectory, { recursive: true, force: true });
});

describe("avatar storage", () => {
  it("converts and stores a square WebP without metadata", async () => {
    const input = await sharp({
      create: {
        width: 40,
        height: 20,
        channels: 3,
        background: "#0B6EFD",
      },
    })
      .jpeg()
      .toBuffer();

    const url = await storeProfilePhoto(
      new File([input], "avatar.jpg", { type: "image/jpeg" }),
    );
    const filename = path.basename(url);
    const output = await readFile(path.join(storageDirectory, filename));
    const metadata = await sharp(output).metadata();

    expect(url).toMatch(/^\/media\/avatars\/[a-f0-9-]{36}\.webp$/);
    expect(metadata).toMatchObject({ format: "webp", width: 512, height: 512 });
    expect(await readStoredProfilePhoto(filename)).toEqual(output);

    await deleteStoredProfilePhoto(url);
    expect(await readStoredProfilePhoto(filename)).toBeNull();
  });

  it("rejects content that is not an image", async () => {
    const file = new File(["not an image"], "avatar.jpg", {
      type: "image/jpeg",
    });

    await expect(storeProfilePhoto(file)).rejects.toBeInstanceOf(
      ProfilePhotoError,
    );
  });
});
