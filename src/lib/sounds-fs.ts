import { open } from "@tauri-apps/plugin-dialog";
import { BaseDirectory, copyFile, exists, mkdir, readFile, remove } from "@tauri-apps/plugin-fs";

/** Supported audio file extensions for custom sounds. */
export const SUPPORTED_AUDIO_EXTENSIONS = [
  "mp3",
  "wav",
  "ogg",
  "aac",
  "m4a",
  "mpeg",
  "webm",
  "3gp",
  "mid",
  "midi",
] as const;

/**
 * Ensures the 'sounds' directory exists in the application data directory. Creates it recursively
 * if it doesn't exist.
 */
export async function ensureSoundsDir() {
  const dirExists = await exists("sounds", { baseDir: BaseDirectory.AppData });
  if (!dirExists) {
    await mkdir("sounds", { baseDir: BaseDirectory.AppData, recursive: true });
  }
}

/**
 * Opens a file picker dialog for audio files.
 *
 * @returns A promise that resolves to the selected file path or null if cancelled.
 */
export async function pickAudioFile(): Promise<string | null> {
  const selected = await open({
    multiple: false,
    filters: [
      {
        name: "Audio",
        extensions: [...SUPPORTED_AUDIO_EXTENSIONS],
      },
    ],
  });
  return selected;
}

/**
 * Copies a source file to the application's sound directory with a unique name.
 *
 * @param sourcePath - The absolute path to the source file.
 * @returns A promise that resolves to the relative path of the copied file.
 * @throws {Error} If the file lacks an extension.
 */
export async function copyToAppData(sourcePath: string): Promise<string> {
  await ensureSoundsDir();
  const lastDot = sourcePath.lastIndexOf(".");
  const lastSep = Math.max(sourcePath.lastIndexOf("/"), sourcePath.lastIndexOf("\\"));
  if (lastDot <= lastSep) {
    throw new Error("File needs to have an extension.");
  }
  const ext = sourcePath.substring(lastDot + 1);
  const filename = `${crypto.randomUUID()}.${ext}`;
  const relativePath = `sounds/${filename}`;
  await copyFile(sourcePath, relativePath, {
    toPathBaseDir: BaseDirectory.AppData,
  });
  return relativePath;
}

/**
 * Deletes a sound file from the application data directory.
 *
 * @param relativePath - The relative path of the file to remove.
 */
export async function removeSoundFile(relativePath: string) {
  try {
    await remove(relativePath, { baseDir: BaseDirectory.AppData });
  } catch {
    // Ignore if file doesn't exist
  }
}

/** Supported audio MIME types mapped by file extension. */
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

/**
 * Guesses the MIME type of a file based on its extension.
 *
 * @param path - The file path or name.
 * @returns The determined MIME type, defaulting to 'audio/mpeg'.
 */
function getMimeType(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  return MIME_TYPES[ext] ?? "audio/mpeg";
}

/**
 * Reads a sound file from app data and generates a temporary Blob URL for playback.
 *
 * @param relativePath - The relative path to the sound file in app data.
 * @returns A promise that resolves to a usable Blob URL.
 */
export async function getSoundBlobUrl(relativePath: string): Promise<string> {
  const data = await readFile(relativePath, { baseDir: BaseDirectory.AppData });
  const blob = new Blob([data], { type: getMimeType(relativePath) });
  return URL.createObjectURL(blob);
}

/**
 * Reads a file from an absolute path and generates a temporary Blob URL.
 *
 * @param absolutePath - The full system path to the file.
 * @returns A promise that resolves to a usable Blob URL.
 */
export async function getAbsoluteFileBlobUrl(absolutePath: string): Promise<string> {
  const data = await readFile(absolutePath);
  const blob = new Blob([data], { type: getMimeType(absolutePath) });
  return URL.createObjectURL(blob);
}
