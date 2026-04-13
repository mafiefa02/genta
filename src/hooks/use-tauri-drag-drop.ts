import { getCurrentWebview } from "@tauri-apps/api/webview";
import { useCallback, useEffect, useRef, useState } from "react";

interface UseTauriDragDropOptions {
  onDrop: (path: string) => void;
  allowedExtensions: ReadonlySet<string>;
  enabled?: boolean;
}

function getExtension(path: string): string {
  const lastDot = path.lastIndexOf(".");
  const lastSep = Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\"));
  if (lastDot <= lastSep) return "";
  return path.substring(lastDot + 1).toLowerCase();
}

export function useTauriDragDrop({
  onDrop,
  allowedExtensions,
  enabled = true,
}: UseTauriDragDropOptions) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [dropError, setDropError] = useState<string | null>(null);

  const onDropRef = useRef(onDrop);
  onDropRef.current = onDrop;

  const errorTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const clearDropError = useCallback(() => {
    setDropError(null);
    clearTimeout(errorTimeoutRef.current);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setIsDragOver(false);
      return;
    }

    let cancelled = false;
    let unlisten: (() => void) | undefined;

    const preventDefault = (e: Event) => e.preventDefault();
    document.addEventListener("dragover", preventDefault);
    document.addEventListener("drop", preventDefault);

    getCurrentWebview()
      .onDragDropEvent((event) => {
        if (cancelled) return;

        if (event.payload.type === "enter" || event.payload.type === "over") {
          setIsDragOver(true);
        } else if (event.payload.type === "drop") {
          setIsDragOver(false);

          const path = event.payload.paths[0];
          if (!path) return;

          const ext = getExtension(path);
          if (ext && allowedExtensions.has(ext)) {
            clearDropError();
            onDropRef.current(path);
          } else {
            clearTimeout(errorTimeoutRef.current);
            setDropError(
              "Format file tidak didukung. Gunakan: mp3, wav, ogg, aac, m4a, webm, dll.",
            );
            errorTimeoutRef.current = setTimeout(() => setDropError(null), 4000);
          }
        } else if (event.payload.type === "leave") {
          setIsDragOver(false);
        }
      })
      .then((fn) => {
        if (cancelled) fn();
        else unlisten = fn;
      });

    return () => {
      cancelled = true;
      unlisten?.();
      document.removeEventListener("dragover", preventDefault);
      document.removeEventListener("drop", preventDefault);
      clearTimeout(errorTimeoutRef.current);
      setIsDragOver(false);
    };
  }, [enabled, allowedExtensions, clearDropError]);

  return { isDragOver, dropError, clearDropError };
}
