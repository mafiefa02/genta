import type { SchedulePreset, SchedulePresetWithDays } from "-/lib/models";

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
import { Textarea } from "-/components/ui/textarea";
import { WEEKDAYS, WeekdayPicker } from "-/components/weekday-picker";
import { DEFAULT_BUSINESS_DAYS, presetsMutations } from "-/hooks/mutations/presets";
import { configQueries } from "-/hooks/queries/config";
import { presetsQueries } from "-/hooks/queries/presets";
import {
  IconCheck,
  IconDotsVertical,
  IconPencil,
  IconPlayerPlay,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/_defaultLayout/presets")({
  component: RouteComponent,
  pendingComponent: PendingComponent,
  loader: ({ context }) => {
    return Promise.all([
      context.queryClient.ensureQueryData(presetsQueries.list()),
      context.queryClient.ensureQueryData(configQueries.activePresetId()),
    ]);
  },
});

function RouteComponent() {
  const { data: presets } = useSuspenseQuery(presetsQueries.list());
  const { data: activePresetId } = useSuspenseQuery(configQueries.activePresetId());
  const queryClient = useQueryClient();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingPreset, setEditingPreset] = useState<SchedulePresetWithDays | null>(null);
  const [deletingPreset, setDeletingPreset] = useState<SchedulePresetWithDays | null>(null);

  const { mutate: activate } = useMutation(
    presetsMutations.activate({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: configQueries.keys.all });
      },
    }),
  );

  return (
    <div className="mx-auto flex w-full flex-col gap-4 overflow-hidden">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-lg font-medium">Preset Jadwal</h1>
          <p className="text-sm text-muted-foreground">
            Kelola preset untuk mengatur berbagai profil jadwal bel.
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <IconPlus data-icon="inline-start" />
          Buat Preset
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        {presets.map((preset) => {
          const isActive = preset.id === activePresetId;
          return (
            <div
              key={preset.id}
              className="flex min-w-0 items-center gap-3 overflow-hidden rounded-2xl border bg-card p-4"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{preset.name}</p>
                <p className="truncate text-sm text-muted-foreground">{preset.description}</p>
                <div className="mt-2 flex gap-1">
                  {WEEKDAYS.map((day) => (
                    <Badge
                      key={day.value}
                      variant={preset.business_days.includes(day.value) ? "secondary" : "outline"}
                      className={
                        preset.business_days.includes(day.value) ? undefined : "opacity-40"
                      }
                    >
                      {day.label}
                    </Badge>
                  ))}
                </div>
              </div>

              {isActive && (
                <Badge>
                  <IconCheck />
                  Aktif
                </Badge>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                  <IconDotsVertical />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuGroup>
                    {!isActive && (
                      <DropdownMenuItem onClick={() => activate(preset.id)}>
                        <IconPlayerPlay />
                        Aktifkan
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => setEditingPreset(preset)}>
                      <IconPencil />
                      Edit
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      variant="destructive"
                      disabled={isActive}
                      onClick={() => setDeletingPreset(preset)}
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

      <CreatePresetDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />

      <Dialog
        open={editingPreset !== null}
        onOpenChange={(open) => {
          if (!open) setEditingPreset(null);
        }}
      >
        {editingPreset && (
          <EditPresetDialogContent preset={editingPreset} onClose={() => setEditingPreset(null)} />
        )}
      </Dialog>

      <Dialog
        open={deletingPreset !== null}
        onOpenChange={(open) => {
          if (!open) setDeletingPreset(null);
        }}
      >
        {deletingPreset && (
          <DeletePresetDialogContent
            preset={deletingPreset}
            onClose={() => setDeletingPreset(null)}
          />
        )}
      </Dialog>
    </div>
  );
}

function CreatePresetDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [businessDays, setBusinessDays] = useState<number[]>(DEFAULT_BUSINESS_DAYS);

  const { mutate: create, isPending } = useMutation(
    presetsMutations.create({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: presetsQueries.keys.all });
        queryClient.invalidateQueries({ queryKey: configQueries.keys.all });
        setName("");
        setDescription("");
        setBusinessDays(DEFAULT_BUSINESS_DAYS);
        onOpenChange(false);
      },
    }),
  );

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed || isPending || businessDays.length === 0) return;
    create({ name: trimmed, description: description.trim() || undefined, businessDays });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Buat Preset Baru</DialogTitle>
          <DialogDescription>
            Masukkan informasi untuk preset baru yang akan dibuat.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="create-name">Nama</Label>
            <Input
              id="create-name"
              placeholder="cth. Jadwal Reguler"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              disabled={isPending}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="create-description">Deskripsi (opsional)</Label>
            <Textarea
              id="create-description"
              placeholder="cth. Jadwal untuk hari biasa"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isPending}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Hari Operasional</Label>
            <WeekdayPicker value={businessDays} onChange={setBusinessDays} disabled={isPending} />
          </div>
        </div>
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Batal</DialogClose>
          <Button
            onClick={handleSubmit}
            disabled={!name.trim() || businessDays.length === 0 || isPending}
          >
            Buat Preset
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditPresetDialogContent({
  preset,
  onClose,
}: {
  preset: SchedulePresetWithDays;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(preset.name);
  const [description, setDescription] = useState(preset.description ?? "");
  const [businessDays, setBusinessDays] = useState<number[]>(preset.business_days);

  const { mutate: update, isPending } = useMutation(
    presetsMutations.update({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: presetsQueries.keys.all });
        onClose();
      },
    }),
  );

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed || isPending || businessDays.length === 0) return;
    update({
      id: preset.id,
      name: trimmed,
      description: description.trim() || undefined,
      businessDays,
    });
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Edit Preset</DialogTitle>
        <DialogDescription>Ubah informasi preset.</DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="edit-name">Nama</Label>
          <Input
            id="edit-name"
            placeholder="cth. Jadwal Reguler"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            disabled={isPending}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="edit-description">Deskripsi (opsional)</Label>
          <Textarea
            id="edit-description"
            placeholder="cth. Jadwal untuk hari biasa"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            disabled={isPending}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>Hari Operasional</Label>
          <WeekdayPicker value={businessDays} onChange={setBusinessDays} disabled={isPending} />
        </div>
      </div>
      <DialogFooter>
        <DialogClose render={<Button variant="outline" />}>Batal</DialogClose>
        <Button onClick={handleSubmit} disabled={!name.trim() || isPending}>
          Simpan
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function DeletePresetDialogContent({
  preset,
  onClose,
}: {
  preset: SchedulePreset;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();

  const {
    mutate: deletePreset,
    isPending,
    error,
  } = useMutation(
    presetsMutations.delete({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: presetsQueries.keys.all });
        onClose();
      },
    }),
  );

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Hapus Preset</DialogTitle>
        <DialogDescription>
          Apakah Anda yakin ingin menghapus preset "{preset.name}"? Tindakan ini tidak dapat
          dibatalkan.
        </DialogDescription>
      </DialogHeader>
      {error && <p className="text-sm text-destructive">{error.message}</p>}
      <DialogFooter>
        <DialogClose render={<Button variant="outline" />}>Batal</DialogClose>
        <Button variant="destructive" onClick={() => deletePreset(preset.id)} disabled={isPending}>
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
          <h1 className="font-heading text-lg font-medium">Preset Jadwal</h1>
          <p className="text-sm text-muted-foreground">
            Kelola preset untuk mengatur berbagai profil jadwal bel.
          </p>
        </div>
        <Button disabled>
          <IconPlus data-icon="inline-start" />
          Buat Preset
        </Button>
      </div>
      <div className="flex flex-col gap-2">
        {[0, 1, 2, 3, 4, 5].map((skeleton) => (
          <Skeleton className="h-20" key={skeleton} />
        ))}
      </div>
    </div>
  );
}
