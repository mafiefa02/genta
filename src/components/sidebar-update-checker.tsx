import { SidebarMenuButton, useSidebar } from "-/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "-/components/ui/tooltip";
import { cn } from "-/lib/utils";
import { IconDownload, IconLoader2, IconSquareRoundedCheck } from "@tabler/icons-react";
import { relaunch } from "@tauri-apps/plugin-process";
import { check, type Update } from "@tauri-apps/plugin-updater";
import { useEffect, useState } from "react";

type UpdateState = "idle" | "checking" | "downloading" | "done" | "error";

/** Example component to test the functionality of the updater
 *  @link https://v2.tauri.app/plugin/updater/#checking-for-updates
 */
export function SidebarUpdateChecker() {
  const { open: sidebarIsOpen } = useSidebar();
  const [update, setUpdate] = useState<Update | null>(null);
  const [status, setStatus] = useState<UpdateState>("idle");
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
      setProgress(0);
      setError(String(err));
      setStatus("error");
    }
  }

  if (status === "checking")
    return <CheckingForUpdateState className={cn(!sidebarIsOpen && "justify-center")} />;
  if (status === "done")
    return <DoneUpdatingState className={cn(!sidebarIsOpen && "justify-center")} />;
  if (status === "error")
    return (
      <FailedToUpdateState
        className={cn(!sidebarIsOpen && "justify-center")}
        retryUpdate={handleUpdate}
        error={error}
      />
    );
  if (!update) return null;

  return (
    <SidebarMenuButton
      className={cn(
        !sidebarIsOpen && "justify-center",
        "border border-border bg-input/30 hover:bg-input/50 hover:text-foreground",
        status !== "downloading" &&
          "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground",
      )}
      tooltip={`New update available (v${update.version})`}
      onClick={handleUpdate}
      disabled={status === "downloading"}
    >
      {status === "downloading" ? <IconLoader2 className="animate-spin" /> : <IconDownload />}
      <span className="line-clamp-1 group-data-[collapsible=icon]:hidden">
        {status === "downloading"
          ? `Downloading ${progress}%`
          : `Update available (v${update.version})`}
      </span>
    </SidebarMenuButton>
  );
}

function CheckingForUpdateState({ className }: { className?: string }) {
  return (
    <SidebarMenuButton
      className={cn(
        className,
        "border border-border bg-input/30 hover:bg-input/50 hover:text-foreground",
      )}
      disabled
    >
      <IconLoader2 className="animate-spin" />
      <span className="group-data-[collapsible=icon]:hidden">Checking for updates...</span>
    </SidebarMenuButton>
  );
}

function DoneUpdatingState({ className }: { className?: string }) {
  return (
    <SidebarMenuButton
      className={cn(
        className,
        "border border-border bg-input/30 hover:bg-input/50 hover:text-foreground",
      )}
    >
      <IconSquareRoundedCheck />
      <span>Update installed. Please restart the app.</span>
    </SidebarMenuButton>
  );
}

function FailedToUpdateState({
  error,
  retryUpdate,
  className,
}: {
  error: string | null;
  retryUpdate: () => void;
  className?: string;
}) {
  return (
    <Tooltip>
      <SidebarMenuButton
        render={<TooltipTrigger />}
        onClick={retryUpdate}
        className={cn(
          className,
          "border border-border bg-input/30 hover:bg-input/50 hover:text-foreground",
        )}
      >
        <IconDownload />
        <span className="line-clamp-1 group-data-[collapsible=icon]:hidden">
          Failed to update. Try again?
        </span>
      </SidebarMenuButton>
      <TooltipContent>
        Update failed: {error || "Update failed with no error. Please contact the developer."}
      </TooltipContent>
    </Tooltip>
  );
}
