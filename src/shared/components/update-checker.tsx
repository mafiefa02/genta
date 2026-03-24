import { check, Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { useCallback, useEffect, useState } from "react";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "@shared/components/ui/dialog";
import { Button } from "@shared/components/ui/button";
import { Progress } from "@shared/components/ui/progress";
import { Loader2Icon } from "lucide-react";

export const UpdateChecker = () => {
  const [update, setUpdate] = useState<Update | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    check()
      .then((update) => {
        if (update?.available) setUpdate(update);
      })
      .catch(() => {});
  }, []);

  const handleUpdate = useCallback(async () => {
    if (!update) return;
    setDownloading(true);
    setError(null);
    try {
      let downloaded = 0;
      await update.downloadAndInstall((event) => {
        if (event.event === "Started" && event.data.contentLength) {
          setProgress(0);
        } else if (event.event === "Progress") {
          downloaded += event.data.chunkLength;
          setProgress(downloaded);
        }
      });
      await relaunch();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
      setDownloading(false);
    }
  }, [update]);

  if (!update) return null;

  return (
    <Dialog open onOpenChange={(open) => !open && !downloading && setUpdate(null)}>
      <DialogPopup showCloseButton={!downloading}>
        <DialogHeader>
          <DialogTitle>Update Available</DialogTitle>
          <DialogDescription>
            Version {update.version} is ready to install.
          </DialogDescription>
        </DialogHeader>
        <DialogPanel>
          {update.body && (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {update.body}
            </p>
          )}
          {downloading && <Progress value={progress} />}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </DialogPanel>
        <DialogFooter>
          {!downloading && (
            <DialogClose render={<Button variant="ghost" />}>
              Later
            </DialogClose>
          )}
          <Button onClick={handleUpdate} disabled={downloading}>
            {downloading ? (
              <>
                <Loader2Icon className="animate-spin" />
                Downloading...
              </>
            ) : (
              "Update & Restart"
            )}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
};
