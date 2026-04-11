import type { CustomSound } from "-/lib/models";

import { Badge } from "-/components/ui/badge";
import { Button } from "-/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "-/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "-/components/ui/dropdown-menu";
import { Input } from "-/components/ui/input";
import { Label } from "-/components/ui/label";
import { Skeleton } from "-/components/ui/skeleton";
import { soundsMutations } from "-/hooks/mutations/sounds";
import { soundsQueries } from "-/hooks/queries/sounds";
import { getAbsoluteFileBlobUrl, getSoundBlobUrl, pickAudioFile } from "-/lib/sounds-fs";
import {
  IconDotsVertical,
  IconFileMusic,
  IconPencil,
  IconPlayerPause,
  IconPlayerPlay,
  IconPlus,
  IconTrash,
  IconUpload,
} from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";

export const Route = createFileRoute("/_defaultLayout/sounds")({
  component: RouteComponent,
  pendingComponent: PendingComponent,
  loader: ({ context }) => {
    return context.queryClient.ensureQueryData(soundsQueries.list());
  },
});

function RouteComponent() {
  const { data: sounds } = useSuspenseQuery(soundsQueries.list());

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingSound, setEditingSound] = useState<CustomSound | null>(null);
  const [deletingSound, setDeletingSound] = useState<CustomSound | null>(null);

  const [playingId, setPlayingId] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stopPlayback = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    setPlayingId(null);
  }, []);

  const playSound = useCallback(
    async (sound: CustomSound) => {
      stopPlayback();
      if (playingId === sound.id) return;
      const url = await getSoundBlobUrl(sound.file_path);
      const audio = new Audio(url);
      audio.addEventListener("ended", () => {
        URL.revokeObjectURL(url);
        setPlayingId(null);
      });
      audio.addEventListener("error", () => {
        URL.revokeObjectURL(url);
        setPlayingId(null);
      });
      audioRef.current = audio;
      setPlayingId(sound.id);
      audio.play().catch(() => setPlayingId(null));
    },
    [playingId, stopPlayback],
  );

  useEffect(() => {
    return () => stopPlayback();
  }, [stopPlayback]);

  return (
    <div className="mx-auto flex w-full flex-col gap-4 overflow-hidden">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-lg font-medium">Suara Kustom</h1>
          <p className="text-sm text-muted-foreground">Kelola suara kustom untuk jadwal bel.</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <IconPlus data-icon="inline-start" />
          Tambah Suara
        </Button>
      </div>

      {sounds.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
          <IconFileMusic size={32} className="opacity-50" />
          <p>Belum ada suara kustom.</p>
          <p className="text-sm">Tambahkan suara untuk digunakan pada jadwal bel.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {sounds.map((sound) => {
            const isPlaying = playingId === sound.id;
            return (
              <div
                key={sound.id}
                className="flex min-w-0 items-center gap-3 overflow-hidden rounded-2xl border bg-card p-4"
              >
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => (isPlaying ? stopPlayback() : playSound(sound))}
                >
                  {isPlaying ? <IconPlayerPause /> : <IconPlayerPlay />}
                </Button>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{sound.label || sound.file_path}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {sound.file_path.split("/").pop()}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                    <IconDotsVertical />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuGroup>
                      <DropdownMenuItem onClick={() => setEditingSound(sound)}>
                        <IconPencil />
                        Edit
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => setDeletingSound(sound)}
                      >
                        <IconTrash />
                        Hapus
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
          })}
        </div>
      )}

      <CreateSoundDialog
        open={createDialogOpen}
        onOpenChange={(open) => {
          if (!open) stopPlayback();
          setCreateDialogOpen(open);
        }}
      />

      <Dialog
        open={editingSound !== null}
        onOpenChange={(open) => {
          if (!open) {
            stopPlayback();
            setEditingSound(null);
          }
        }}
      >
        {editingSound && (
          <EditSoundDialogContent
            sound={editingSound}
            onClose={() => {
              stopPlayback();
              setEditingSound(null);
            }}
          />
        )}
      </Dialog>

      <Dialog
        open={deletingSound !== null}
        onOpenChange={(open) => {
          if (!open) setDeletingSound(null);
        }}
      >
        {deletingSound && (
          <DeleteSoundDialogContent sound={deletingSound} onClose={() => setDeletingSound(null)} />
        )}
      </Dialog>
    </div>
  );
}

function CreateSoundDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [label, setLabel] = useState("");
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);

  const { mutate: create, isPending } = useMutation(
    soundsMutations.create({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: soundsQueries.keys.all });
        resetForm();
        onOpenChange(false);
      },
    }),
  );

  function resetForm() {
    setLabel("");
    setSelectedPath(null);
    stopPreview();
  }

  function stopPreview() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    setIsPreviewPlaying(false);
  }

  async function handlePickFile() {
    const path = await pickAudioFile();
    if (!path) return;
    setSelectedPath(path);
    stopPreview();
    if (!label.trim()) {
      const fileName = path.split("/").pop()?.split("\\").pop() ?? "";
      const nameWithoutExt = fileName.replace(/\.[^.]+$/, "");
      setLabel(nameWithoutExt);
    }
  }

  async function togglePreview() {
    if (isPreviewPlaying) {
      stopPreview();
      return;
    }
    if (!selectedPath) return;
    const url = await getAbsoluteFileBlobUrl(selectedPath);
    const audio = new Audio(url);
    audio.addEventListener("ended", () => {
      URL.revokeObjectURL(url);
      setIsPreviewPlaying(false);
    });
    audio.addEventListener("error", () => {
      URL.revokeObjectURL(url);
      setIsPreviewPlaying(false);
    });
    audioRef.current = audio;
    setIsPreviewPlaying(true);
    audio.play().catch(() => setIsPreviewPlaying(false));
  }

  const handleSubmit = () => {
    const trimmed = label.trim();
    if (!trimmed || !selectedPath || isPending) return;
    create({ label: trimmed, sourcePath: selectedPath });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(newOpen) => {
        if (!newOpen) {
          resetForm();
        }
        onOpenChange(newOpen);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Tambah Suara</DialogTitle>
          <DialogDescription>Pilih file audio dan beri label untuk suara kustom.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>File Audio</Label>
            {selectedPath ? (
              <div className="flex items-center gap-2 rounded-xl border bg-muted/50 p-3">
                <IconFileMusic className="shrink-0 text-muted-foreground" size={20} />
                <span className="min-w-0 flex-1 truncate text-sm">
                  {selectedPath.split("/").pop()?.split("\\").pop()}
                </span>
                <Button variant="ghost" size="icon-sm" onClick={togglePreview} disabled={isPending}>
                  {isPreviewPlaying ? <IconPlayerPause size={16} /> : <IconPlayerPlay size={16} />}
                </Button>
                <Button variant="outline" size="sm" onClick={handlePickFile} disabled={isPending}>
                  Ganti
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={handlePickFile}
                disabled={isPending}
                className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-dashed p-6 text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
              >
                <IconUpload size={24} />
                <span className="text-sm">Klik untuk memilih file audio</span>
              </button>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="create-label">Label</Label>
            <Input
              id="create-label"
              placeholder="cth. Bel Sekolah"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              disabled={isPending}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Batal</DialogClose>
          <Button onClick={handleSubmit} disabled={!label.trim() || !selectedPath || isPending}>
            Tambah Suara
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditSoundDialogContent({ sound, onClose }: { sound: CustomSound; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [label, setLabel] = useState(sound.label ?? "");
  const [newSourcePath, setNewSourcePath] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);

  const { mutate: update, isPending } = useMutation(
    soundsMutations.update({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: soundsQueries.keys.all });
        onClose();
      },
    }),
  );

  function stopPreview() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    setIsPreviewPlaying(false);
  }

  async function handlePickFile() {
    const path = await pickAudioFile();
    if (!path) return;
    setNewSourcePath(path);
    stopPreview();
  }

  async function togglePreview() {
    if (isPreviewPlaying) {
      stopPreview();
      return;
    }
    const url = newSourcePath
      ? await getAbsoluteFileBlobUrl(newSourcePath)
      : await getSoundBlobUrl(sound.file_path);
    const audio = new Audio(url);
    audio.addEventListener("ended", () => {
      URL.revokeObjectURL(url);
      setIsPreviewPlaying(false);
    });
    audio.addEventListener("error", () => {
      URL.revokeObjectURL(url);
      setIsPreviewPlaying(false);
    });
    audioRef.current = audio;
    setIsPreviewPlaying(true);
    audio.play().catch(() => setIsPreviewPlaying(false));
  }

  useEffect(() => {
    return () => stopPreview();
  }, []);

  const displayFileName = newSourcePath
    ? newSourcePath.split("/").pop()?.split("\\").pop()
    : sound.file_path.split("/").pop();

  const handleSubmit = () => {
    const trimmed = label.trim();
    if (!trimmed || isPending) return;
    update({
      id: sound.id,
      label: trimmed,
      newSourcePath: newSourcePath ?? undefined,
    });
  };

  return (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Edit Suara</DialogTitle>
        <DialogDescription>Ubah label atau file audio suara kustom.</DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <Label>File Audio</Label>
          <div className="flex items-center gap-2 rounded-xl border bg-muted/50 p-3">
            <IconFileMusic className="shrink-0 text-muted-foreground" size={20} />
            <span className="min-w-0 flex-1 truncate text-sm">
              {displayFileName}
              {newSourcePath && (
                <Badge variant="secondary" className="ml-2">
                  Baru
                </Badge>
              )}
            </span>
            <Button variant="ghost" size="icon-sm" onClick={togglePreview} disabled={isPending}>
              {isPreviewPlaying ? <IconPlayerPause size={16} /> : <IconPlayerPlay size={16} />}
            </Button>
            <Button variant="outline" size="sm" onClick={handlePickFile} disabled={isPending}>
              Ganti
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="edit-label">Label</Label>
          <Input
            id="edit-label"
            placeholder="cth. Bel Sekolah"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            disabled={isPending}
          />
        </div>
      </div>
      <DialogFooter>
        <DialogClose render={<Button variant="outline" />}>Batal</DialogClose>
        <Button onClick={handleSubmit} disabled={!label.trim() || isPending}>
          Simpan
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function DeleteSoundDialogContent({ sound, onClose }: { sound: CustomSound; onClose: () => void }) {
  const queryClient = useQueryClient();
  const { data: scheduleCount } = useQuery(soundsQueries.scheduleCount(sound.id));

  const { mutate: deleteSound, isPending } = useMutation(
    soundsMutations.delete({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: soundsQueries.keys.all });
        onClose();
      },
    }),
  );

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Hapus Suara</DialogTitle>
        <DialogDescription>
          Apakah Anda yakin ingin menghapus suara "{sound.label || sound.file_path}"? Tindakan ini
          tidak dapat dibatalkan.
        </DialogDescription>
        {scheduleCount != null && scheduleCount > 0 && (
          <DialogDescription className="text-amber-600 dark:text-amber-400">
            Suara ini digunakan oleh {scheduleCount} jadwal. Jadwal tersebut akan kembali
            menggunakan suara default.
          </DialogDescription>
        )}
      </DialogHeader>
      <DialogFooter>
        <DialogClose render={<Button variant="outline" />}>Batal</DialogClose>
        <Button
          variant="destructive"
          onClick={() => deleteSound({ id: sound.id, filePath: sound.file_path })}
          disabled={isPending}
        >
          Hapus
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function PendingComponent() {
  return (
    <div className="mx-auto flex w-full flex-col gap-4 overflow-hidden">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-lg font-medium">Suara Kustom</h1>
          <p className="text-sm text-muted-foreground">Kelola suara kustom untuk jadwal bel.</p>
        </div>
        <Button disabled>
          <IconPlus data-icon="inline-start" />
          Tambah Suara
        </Button>
      </div>
      <div className="flex flex-col gap-2">
        {[0, 1, 2].map((skeleton) => (
          <Skeleton className="h-20" key={skeleton} />
        ))}
      </div>
    </div>
  );
}
