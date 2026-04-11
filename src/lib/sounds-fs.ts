import { open } from "@tauri-apps/plugin-dialog";
import { BaseDirectory, copyFile, exists, mkdir, readFile, remove } from "@tauri-apps/plugin-fs";

export async function ensureSoundsDir() {
  const dirExists = await exists("sounds", { baseDir: BaseDirectory.AppData });
  if (!dirExists) {
    await mkdir("sounds", { baseDir: BaseDirectory.AppData, recursive: true });
  }
}

export async function pickAudioFile(): Promise<string | null> {
  const selected = await open({
    multiple: false,
    filters: [
      {
        name: "Audio",
        extensions: ["mp3", "wav", "ogg", "aac", "m4a", "mpeg", "webm", "3gp", "mid", "midi"],
      },
    ],
  });
  return selected;
}

export async function copyToAppData(sourcePath: string): Promise<string> {
  await ensureSoundsDir();
  const lastDot = sourcePath.lastIndexOf(".");
  const lastSep = Math.max(sourcePath.lastIndexOf("/"), sourcePath.lastIndexOf("\\"));
  if (lastDot <= lastSep) {
    throw new Error("File harus memiliki ekstensi.");
  }
  const ext = sourcePath.substring(lastDot + 1);
  const filename = `${crypto.randomUUID()}.${ext}`;
  const relativePath = `sounds/${filename}`;
  await copyFile(sourcePath, relativePath, {
    toPathBaseDir: BaseDirectory.AppData,
  });
  return relativePath;
}

export async function removeSoundFile(relativePath: string) {
  try {
    await remove(relativePath, { baseDir: BaseDirectory.AppData });
  } catch {
    // Ignore if file doesn't exist
  }
}

const MIME_TYPES: Record<string, string> = {
  mp3: "audio/mpeg",
  wav: "audio/wav",
  ogg: "audio/ogg",
  flac: "audio/flac",
  aac: "audio/aac",
  m4a: "audio/mp4",
  mpeg: "audio/mpeg",
  webm: "audio/webm",
  "3gp": "audio/3gpp",
  mid: "audio/midi",
  midi: "audio/midi",
};

function getMimeType(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  return MIME_TYPES[ext] ?? "audio/mpeg";
}

export async function getSoundBlobUrl(relativePath: string): Promise<string> {
  const data = await readFile(relativePath, { baseDir: BaseDirectory.AppData });
  const blob = new Blob([data], { type: getMimeType(relativePath) });
  return URL.createObjectURL(blob);
}

export async function getAbsoluteFileBlobUrl(absolutePath: string): Promise<string> {
  const data = await readFile(absolutePath);
  const blob = new Blob([data], { type: getMimeType(absolutePath) });
  return URL.createObjectURL(blob);
}
