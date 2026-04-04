import { Button } from "-/components/ui/button";
import { relaunch } from "@tauri-apps/plugin-process";
import { check, type Update } from "@tauri-apps/plugin-updater";
import { useEffect, useState } from "react";

/** Example component to test the functionality of the updater
 *  @link https://v2.tauri.app/plugin/updater/#checking-for-updates
 */
export function UpdateChecker() {
  const [update, setUpdate] = useState<Update | null>(null);
  const [status, setStatus] = useState<"idle" | "checking" | "downloading" | "done" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setStatus("checking");
    check()
      .then((update) => {
        setUpdate(update);
        setStatus("idle");
      })
      .catch((err) => {
        setError(String(err));
        setStatus("error");
      });
  }, []);

  async function handleUpdate() {
    if (!update) return;

    setStatus("downloading");
    try {
      let downloaded = 0;
      let contentLength = 0;
      await update.downloadAndInstall((event) => {
        switch (event.event) {
          case "Started":
            contentLength = event.data.contentLength ?? 0;
            setProgress(0);
            break;
          case "Progress":
            downloaded += event.data.chunkLength;
            if (contentLength > 0) {
              setProgress(Math.round((downloaded / contentLength) * 100));
            }
            break;
          case "Finished":
            setProgress(100);
            break;
        }
      });
      setStatus("done");
      await relaunch();
    } catch (err) {
      setError(String(err));
      setStatus("error");
    }
  }

  if (status === "checking") return <p>Checking for updates...</p>;
  if (status === "error") return <p>Update error: {error}</p>;
  if (status === "done") return <p>Update installed. Please restart the app.</p>;
  if (!update) return null;

  return (
    <div className="flex items-center gap-2">
      <span>Update {update.version} available</span>
      <Button size="sm" onClick={handleUpdate} disabled={status === "downloading"}>
        {status === "downloading" ? `Downloading ${progress}%` : "Update now"}
      </Button>
    </div>
  );
}
