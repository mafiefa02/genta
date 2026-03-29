import { NoDataIllustration } from "@shared/components/illustrations/no-data";
import { WarningIllustration } from "@shared/components/illustrations/warning";
import { Button } from "@shared/components/ui/button";
import { Card, CardContent } from "@shared/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "@shared/components/ui/dialog";
import { Input } from "@shared/components/ui/input";
import { Label } from "@shared/components/ui/label";
import { Skeleton } from "@shared/components/ui/skeleton";
import { Slider } from "@shared/components/ui/slider";
import { useDebounce } from "@shared/lib/hooks";
import { services } from "@shared/lib/services";
import { cn, minutesToTime } from "@shared/lib/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { invoke } from "@tauri-apps/api/core";
import { Edit, Loader2, Music, Pause, Play, Trash } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useSearchContext } from "../contexts/search-context";

export const SoundList = ({
  className,
  ...props
}: React.ComponentProps<"div">) => {
  const { search } = useSearchContext();
  const debouncedSearch = useDebounce(search, 250);
  const player = useSoundPlayer();
  const [editingSound, setEditingSound] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [deletingSound, setDeletingSound] = useState<{
    id: number;
    fileName: string;
  } | null>(null);

  const {
    data: sounds,
    isPending,
    isError,
    error,
  } = useQuery(services.sound.query.getSounds);

  if (isPending) return <SoundListPending />;
  if (isError) return <SoundListError error={error.message} />;

  const filteredSounds = sounds?.filter((sound) =>
    sound.name.toLowerCase().includes(debouncedSearch.toLowerCase()),
  );

  if (!filteredSounds || filteredSounds.length === 0) return <SoundListEmpty />;

  return (
    <>
      <div
        className={cn("flex flex-col gap-3", className)}
        {...props}
      >
        {filteredSounds.map((sound) => {
          const isCurrent = player.playingId === sound.id;
          return (
            <SoundListItem
              key={sound.id}
              id={sound.id}
              name={sound.name}
              fileName={sound.file_name}
              isCurrent={isCurrent}
              isPlaying={isCurrent && player.isPlaying}
              currentTime={isCurrent ? player.currentTime : 0}
              duration={isCurrent ? player.duration : 0}
              isLoading={isCurrent && player.isLoading}
              onPlay={() => player.play(sound.id, sound.file_name)}
              onPause={player.pause}
              onSeek={player.seek}
              onEdit={() =>
                setEditingSound({ id: sound.id, name: sound.name })
              }
              onDelete={() =>
                setDeletingSound({ id: sound.id, fileName: sound.file_name })
              }
            />
          );
        })}
      </div>
      <SoundEditDialog
        data={editingSound}
        onOpenChange={(open) => !open && setEditingSound(null)}
      />
      <SoundDeleteDialog
        data={deletingSound}
        onOpenChange={(open) => !open && setDeletingSound(null)}
      />
    </>
  );
};

const SoundListItem = ({
  name,
  fileName,
  isCurrent,
  isPlaying,
  currentTime,
  duration,
  isLoading,
  onPlay,
  onPause,
  onSeek,
  onEdit,
  onDelete,
}: {
  id: number;
  name: string;
  fileName: string;
  isCurrent: boolean;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isLoading: boolean;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (time: number) => void;
  onEdit: () => void;
  onDelete: () => void;
}) => {
  return (
    <Card
      className={cn(
        "group transition-all",
        isCurrent && "border-primary/50 bg-primary/5",
      )}
    >
      <CardContent className="relative flex items-center gap-4">
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors",
            isCurrent && "bg-primary text-primary-foreground",
          )}
        >
          {isLoading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Music className="size-4" />
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-center justify-between gap-2">
            <h1 className="truncate font-semibold">{name}</h1>
            {isCurrent && (
              <span className="text-xs font-medium whitespace-nowrap text-primary tabular-nums">
                {minutesToTime(currentTime)} / {minutesToTime(duration)}
              </span>
            )}
          </div>

          {isCurrent ? (
            <div
              className="flex flex-1 items-center pt-1"
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <Slider
                min={0}
                max={duration > 0 ? duration : 100}
                value={currentTime}
                onValueChange={(vals) =>
                  vals instanceof Array ? onSeek(vals[0]) : onSeek(vals)
                }
              />
            </div>
          ) : (
            <p className="max-w-[300px] truncate text-xs text-muted-foreground">
              {fileName.split(/[\\/]/).pop()}
            </p>
          )}
        </div>

        <div
          className={cn(
            "items-center gap-3 [&_svg]:size-4!",
            isCurrent
              ? "flex pl-2"
              : "absolute right-0 hidden h-full bg-card mask-[linear-gradient(to_right,transparent,theme(--color-card)_2rem)] pr-4 pl-10 group-hover:flex",
          )}
        >
          <Button
            variant={isCurrent ? "default" : "ghost"}
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              if (isCurrent && isPlaying) {
                onPause();
              } else {
                onPlay();
              }
            }}
            disabled={isLoading}
            title={isCurrent && isPlaying ? "Pause" : "Preview"}
          >
            {isCurrent && isPlaying ? (
              <Pause className="size-4" />
            ) : (
              <Play className="ml-0.5 size-4" />
            )}
          </Button>

          {!isCurrent && (
            <>
              <Button
                variant="ghost"
                size="icon"
                title="Edit Name"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
              >
                <Edit />
              </Button>
              <Button
                variant="destructive-outline"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <Trash />
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const useSoundPlayer = () => {
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);

  const cleanup = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
  };

  useEffect(() => {
    return cleanup;
  }, []);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    if (!isPlaying && playingId !== null) {
      // If paused for 3 seconds, reset the state
      timeout = setTimeout(() => {
        setPlayingId(null);
        cleanup();
      }, 3000);
    }

    return () => clearTimeout(timeout);
  }, [isPlaying, playingId]);

  const play = async (id: number, filePath: string) => {
    if (playingId === id) {
      if (audioRef.current) {
        audioRef.current.play();
        setIsPlaying(true);
      }
      return;
    }

    cleanup();

    setIsLoading(true);
    setPlayingId(id);
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);

    try {
      const bytes = await invoke<number[]>("read_sound_file", { filePath });

      const extension = filePath.split(".").pop()?.toLowerCase();
      const mimeTypes: Record<string, string> = {
        mp3: "audio/mpeg",
        wav: "audio/wav",
        ogg: "audio/ogg",
        oga: "audio/ogg",
        flac: "audio/flac",
        m4a: "audio/mp4",
        aac: "audio/aac",
        mp4: "audio/mp4",
        aiff: "audio/aiff",
        aif: "audio/aiff",
        caf: "audio/x-caf",
        webm: "audio/webm",
        weba: "audio/webm",
        mka: "audio/x-matroska",
      };
      const mimeType = (extension && mimeTypes[extension]) || "audio/mpeg";

      const blob = new Blob([new Uint8Array(bytes)], { type: mimeType });
      const url = URL.createObjectURL(blob);
      urlRef.current = url;

      const audio = new Audio(url);
      audioRef.current = audio;

      audio.addEventListener("loadedmetadata", () => {
        setDuration(audio.duration);
        setIsLoading(false);
        audio.play().catch((e) => console.error("Play error", e));
        setIsPlaying(true);
      });

      let rafId: number;
      audio.addEventListener("timeupdate", () => {
        cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          setCurrentTime(audio.currentTime);
        });
      });

      audio.addEventListener("ended", () => {
        setIsPlaying(false);
        setPlayingId(null);
        cleanup();
      });

      audio.addEventListener("pause", () => {
        setIsPlaying(false);
      });

      audio.addEventListener("play", () => {
        setIsPlaying(true);
      });
    } catch (error) {
      console.error("Failed to load sound:", error);
      setIsLoading(false);
      setPlayingId(null);
      cleanup();
    }
  };

  const pause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const seek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  return {
    playingId,
    isPlaying,
    currentTime,
    duration,
    isLoading,
    play,
    pause,
    seek,
  };
};

const SoundEditDialog = ({
  data,
  onOpenChange,
}: {
  data: { id: number; name: string } | null;
  onOpenChange: (open: boolean) => void;
}) => {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");

  useEffect(() => {
    if (data) setName(data.name);
  }, [data]);

  const updateSound = useMutation({
    ...services.sound.mutation.updateSound,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sounds"] });
      onOpenChange(false);
    },
  });

  return (
    <Dialog open={data !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Sound Name</DialogTitle>
          <DialogDescription>
            Sound names are used to identify saved custom sounds.
          </DialogDescription>
        </DialogHeader>
        <DialogPanel>
          <div className="grid gap-2">
            <Label htmlFor="edit-sound-name">Display Name</Label>
            <Input
              id="edit-sound-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        </DialogPanel>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (data) updateSound.mutate({ id: data.id, name });
            }}
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const SoundDeleteDialog = ({
  data,
  onOpenChange,
}: {
  data: { id: number; fileName: string } | null;
  onOpenChange: (open: boolean) => void;
}) => {
  const queryClient = useQueryClient();
  const deleteSound = useMutation({
    ...services.sound.mutation.deleteSound,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sounds"] });
      onOpenChange(false);
    },
  });

  const handleDelete = async () => {
    if (!data) return;
    deleteSound.mutate(data.id);
    try {
      await invoke("delete_sound_file", { filePath: data.fileName });
    } catch (e) {
      console.error("Failed to delete file:", e);
    }
  };

  return (
    <Dialog open={data !== null} onOpenChange={onOpenChange}>
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>Are you sure?</DialogTitle>
          <DialogDescription>
            You are about to delete this sound. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleDelete} variant="destructive">
            Delete
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
};

const SoundListPending = ({
  className,
  ...props
}: React.ComponentProps<"div">) => {
  const [skeletonCount] = useState(() => Math.floor(Math.random() * 4) + 3);
  return (
    <div
      className={cn("flex flex-1 flex-col gap-3", className)}
      {...props}
    >
      {Array.from({ length: skeletonCount }).map((_, i) => (
        <Skeleton
          key={`skeleton-${i}`}
          className="h-24 w-full rounded-2xl"
        />
      ))}
    </div>
  );
};

const SoundListError = ({
  className,
  error,
  ...props
}: React.ComponentProps<"div"> & { error: string }) => {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-4 px-8",
        className,
      )}
      {...props}
    >
      <WarningIllustration className="size-40" />
      <div className="flex max-w-[60ch] flex-col gap-1 text-center">
        <h1 className="text-xl font-semibold">Oops! Something went wrong</h1>
        <h3 className="text-balance text-muted-foreground">{error}</h3>
      </div>
    </div>
  );
};

const SoundListEmpty = ({
  className,
  ...props
}: React.ComponentProps<"div">) => {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-4 px-8",
        className,
      )}
      {...props}
    >
      <NoDataIllustration className="size-40" />
      <div className="flex max-w-[60ch] flex-col gap-1 text-center">
        <h1 className="text-xl font-semibold">No Sounds Found</h1>
        <h3 className="text-balance text-muted-foreground">
          Upload your custom sounds to use them in schedules.
        </h3>
      </div>
    </div>
  );
};
