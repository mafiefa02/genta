import type { CustomSound, Schedule, ScheduleWithWeekdays } from "-/lib/models";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "-/components/ui/select";
import { Skeleton } from "-/components/ui/skeleton";
import { Textarea } from "-/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "-/components/ui/toggle-group";
import { WEEKDAYS, WeekdayPicker } from "-/components/weekday-picker";
import { DEFAULT_BUSINESS_DAYS } from "-/hooks/mutations/presets";
import { schedulesMutations } from "-/hooks/mutations/schedules";
import { configQueries } from "-/hooks/queries/config";
import { presetsQueries } from "-/hooks/queries/presets";
import { schedulesQueries } from "-/hooks/queries/schedules";
import { soundsQueries } from "-/hooks/queries/sounds";
import {
  IconDotsVertical,
  IconPencil,
  IconPlayerPause,
  IconPlayerPlay,
  IconPlus,
  IconSearch,
  IconTrash,
} from "@tabler/icons-react";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/_defaultLayout/schedules")({
  component: RouteComponent,
  pendingComponent: PendingComponent,
  errorComponent: ErrorComponent,
  loader: async ({ context }) => {
    const [activePresetId] = await Promise.all([
      context.queryClient.ensureQueryData(configQueries.activePresetId()),
      context.queryClient.ensureQueryData(presetsQueries.list()),
      context.queryClient.ensureQueryData(soundsQueries.list()),
    ]);
    if (activePresetId) {
      await context.queryClient.ensureQueryData(schedulesQueries.byPreset(activePresetId));
    }
  },
});

/** Convert UTC seconds-since-midnight to local { hours, minutes }. */
function utcSecondsToLocal(utcSeconds: number) {
  const offsetSeconds = new Date().getTimezoneOffset() * 60;
  const local = (((utcSeconds - offsetSeconds) % 86400) + 86400) % 86400;
  return { hours: Math.floor(local / 3600), minutes: Math.floor((local % 3600) / 60) };
}

/** Convert local hours + minutes to UTC seconds-since-midnight. */
function localToUtcSeconds(hours: number, minutes: number) {
  const local = hours * 3600 + minutes * 60;
  const offsetSeconds = new Date().getTimezoneOffset() * 60;
  return (((local + offsetSeconds) % 86400) + 86400) % 86400;
}

/** Format hours and minutes as "HH:MM". */
function fmtTime(hours: number, minutes: number) {
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

/** Parse an "HH:MM" string into { hours, minutes }. */
function parseTime(value: string) {
  const [h, m] = value.split(":").map(Number);
  return { hours: h ?? 0, minutes: m ?? 0 };
}

function RouteComponent() {
  const { data: activePresetId } = useSuspenseQuery(configQueries.activePresetId());
  const { data: presets } = useSuspenseQuery(presetsQueries.list());
  const activePreset = presets.find((p) => p.id === activePresetId);

  // We need activePresetId to be valid to fetch schedules
  if (!activePresetId || !activePreset) {
    return (
      <div className="mx-auto flex w-full flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          Tidak ada preset aktif. Silakan aktifkan preset terlebih dahulu.
        </p>
      </div>
    );
  }

  return <ScheduleList presetId={activePresetId} businessDays={activePreset.business_days} />;
}

function ScheduleList({ presetId, businessDays }: { presetId: number; businessDays: number[] }) {
  const { data: schedules } = useSuspenseQuery(schedulesQueries.byPreset(presetId));
  const { data: sounds } = useSuspenseQuery(soundsQueries.list());
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [viewDay, setViewDay] = useState<number | null>(() => {
    // ISO weekday: 1=Monday … 7=Sunday (getDay() returns 0=Sun, so convert)
    const jsDay = new Date().getDay();
    const isoDay = jsDay === 0 ? 7 : jsDay;
    return businessDays.includes(isoDay) ? isoDay : null;
  });
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ScheduleWithWeekdays | null>(null);
  const [deletingSchedule, setDeletingSchedule] = useState<ScheduleWithWeekdays | null>(null);

  const { mutate: toggleActive } = useMutation(
    schedulesMutations.toggleActive({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: schedulesQueries.keys.all });
      },
    }),
  );

  const filtered = useMemo(() => {
    let result = schedules;
    if (viewDay !== null) {
      result = result.filter((s) => s.weekdays.includes(viewDay));
    }
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter((s) => s.label.toLowerCase().includes(q));
    }
    return result;
  }, [schedules, search, viewDay]);

  return (
    <div className="mx-auto flex w-full flex-col gap-4 overflow-hidden">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-lg font-medium">Jadwal</h1>
          <p className="text-sm text-muted-foreground">
            Kelola jadwal bel untuk preset yang sedang aktif.
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <IconPlus data-icon="inline-start" />
          Buat Jadwal
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        <div className="relative">
          <IconSearch className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari jadwal..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <ToggleGroup
          value={[viewDay === null ? "all" : String(viewDay)]}
          onValueChange={(vals) => {
            const current = viewDay === null ? "all" : String(viewDay);
            const picked = vals.find((v) => v !== current) ?? "all";
            setViewDay(picked === "all" ? null : Number(picked));
          }}
          size="sm"
          variant="outline"
          className="w-full"
        >
          <ToggleGroupItem value="all" className="flex-1">
            Semua
          </ToggleGroupItem>
          {businessDays.map((day) => {
            const label = WEEKDAYS.find((w) => w.value === day)?.label ?? String(day);
            return (
              <ToggleGroupItem key={day} value={String(day)} className="flex-1">
                {label}
              </ToggleGroupItem>
            );
          })}
        </ToggleGroup>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">
            {search.trim()
              ? "Tidak ada jadwal yang cocok dengan pencarian."
              : "Belum ada jadwal untuk pencarian ini."}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((schedule) => {
            const { hours, minutes } = utcSecondsToLocal(schedule.utc_trigger_time);
            const isActive = schedule.is_active === 1;
            return (
              <div
                key={schedule.id}
                className="flex min-w-0 items-center gap-3 overflow-hidden rounded-2xl border bg-card p-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium">{fmtTime(hours, minutes)}</p>
                    <p className="truncate font-medium">{schedule.label}</p>
                    <Badge variant={isActive ? "default" : "outline"}>
                      {isActive ? "Aktif" : "Nonaktif"}
                    </Badge>
                  </div>
                  {schedule.description && (
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">
                      {schedule.description}
                    </p>
                  )}
                  <div className="mt-2 flex gap-1">
                    {WEEKDAYS.map((day) => (
                      <Badge
                        key={day.value}
                        variant={schedule.weekdays.includes(day.value) ? "secondary" : "outline"}
                        className={schedule.weekdays.includes(day.value) ? undefined : "opacity-40"}
                      >
                        {day.label}
                      </Badge>
                    ))}
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                    <IconDotsVertical />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuGroup>
                      <DropdownMenuItem
                        onClick={() => toggleActive({ id: schedule.id, isActive: !isActive })}
                      >
                        {isActive ? <IconPlayerPause /> : <IconPlayerPlay />}
                        {isActive ? "Nonaktifkan" : "Aktifkan"}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setEditingSchedule(schedule)}>
                        <IconPencil />
                        Edit
                      </DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => setDeletingSchedule(schedule)}
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

      <CreateScheduleDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        presetId={presetId}
        businessDays={businessDays}
        sounds={sounds}
      />

      <Dialog
        open={editingSchedule !== null}
        onOpenChange={(open) => {
          if (!open) setEditingSchedule(null);
        }}
      >
        {editingSchedule && (
          <EditScheduleDialogContent
            schedule={editingSchedule}
            businessDays={businessDays}
            sounds={sounds}
            onClose={() => setEditingSchedule(null)}
          />
        )}
      </Dialog>

      <Dialog
        open={deletingSchedule !== null}
        onOpenChange={(open) => {
          if (!open) setDeletingSchedule(null);
        }}
      >
        {deletingSchedule && (
          <DeleteScheduleDialogContent
            schedule={deletingSchedule}
            onClose={() => setDeletingSchedule(null)}
          />
        )}
      </Dialog>
    </div>
  );
}

function CreateScheduleDialog({
  open,
  onOpenChange,
  presetId,
  businessDays,
  sounds,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  presetId: number;
  businessDays: number[];
  sounds: CustomSound[];
}) {
  const queryClient = useQueryClient();
  const [label, setLabel] = useState("");
  const [description, setDescription] = useState("");
  const [time, setTime] = useState("07:00");
  const [weekdays, setWeekdays] = useState<number[]>(businessDays);
  const [customSoundId, setCustomSoundId] = useState<number | null>(null);

  const { mutate: create, isPending } = useMutation(
    schedulesMutations.create({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: schedulesQueries.keys.all });
        setLabel("");
        setDescription("");
        setTime("07:00");
        setWeekdays(businessDays);
        setCustomSoundId(null);
        onOpenChange(false);
      },
    }),
  );

  const handleSubmit = () => {
    const trimmed = label.trim();
    if (!trimmed || isPending || weekdays.length === 0) return;
    const { hours, minutes } = parseTime(time);
    create({
      label: trimmed,
      description: description.trim() || undefined,
      utcTriggerTime: localToUtcSeconds(hours, minutes),
      presetId,
      weekdays,
      customSoundId,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Buat Jadwal Baru</DialogTitle>
          <DialogDescription>
            Masukkan informasi untuk jadwal baru yang akan dibuat.
          </DialogDescription>
        </DialogHeader>
        <ScheduleForm
          label={label}
          onLabelChange={setLabel}
          description={description}
          onDescriptionChange={setDescription}
          time={time}
          onTimeChange={setTime}
          weekdays={weekdays}
          onWeekdaysChange={setWeekdays}
          businessDays={businessDays}
          customSoundId={customSoundId}
          onCustomSoundIdChange={setCustomSoundId}
          sounds={sounds}
          disabled={isPending}
          onSubmit={handleSubmit}
        />
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Batal</DialogClose>
          <Button
            onClick={handleSubmit}
            disabled={!label.trim() || weekdays.length === 0 || isPending}
          >
            Buat Jadwal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditScheduleDialogContent({
  schedule,
  businessDays,
  sounds,
  onClose,
}: {
  schedule: ScheduleWithWeekdays;
  businessDays: number[];
  sounds: CustomSound[];
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const localTime = utcSecondsToLocal(schedule.utc_trigger_time);

  const [label, setLabel] = useState(schedule.label);
  const [description, setDescription] = useState(schedule.description ?? "");
  const [time, setTime] = useState(fmtTime(localTime.hours, localTime.minutes));
  const [weekdays, setWeekdays] = useState<number[]>(schedule.weekdays);
  const [customSoundId, setCustomSoundId] = useState<number | null>(schedule.custom_sound_id);

  const { mutate: update, isPending } = useMutation(
    schedulesMutations.update({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: schedulesQueries.keys.all });
        onClose();
      },
    }),
  );

  const handleSubmit = () => {
    const trimmed = label.trim();
    if (!trimmed || isPending || weekdays.length === 0) return;
    const { hours, minutes } = parseTime(time);
    update({
      id: schedule.id,
      label: trimmed,
      description: description.trim() || undefined,
      utcTriggerTime: localToUtcSeconds(hours, minutes),
      weekdays,
      customSoundId,
    });
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Edit Jadwal</DialogTitle>
        <DialogDescription>Ubah informasi jadwal.</DialogDescription>
      </DialogHeader>
      <ScheduleForm
        label={label}
        onLabelChange={setLabel}
        description={description}
        onDescriptionChange={setDescription}
        time={time}
        onTimeChange={setTime}
        weekdays={weekdays}
        onWeekdaysChange={setWeekdays}
        businessDays={businessDays}
        customSoundId={customSoundId}
        onCustomSoundIdChange={setCustomSoundId}
        sounds={sounds}
        disabled={isPending}
        onSubmit={handleSubmit}
      />
      <DialogFooter>
        <DialogClose render={<Button variant="outline" />}>Batal</DialogClose>
        <Button
          onClick={handleSubmit}
          disabled={!label.trim() || weekdays.length === 0 || isPending}
        >
          Simpan
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function DeleteScheduleDialogContent({
  schedule,
  onClose,
}: {
  schedule: Schedule;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();

  const { mutate: deleteSchedule, isPending } = useMutation(
    schedulesMutations.delete({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: schedulesQueries.keys.all });
        onClose();
      },
    }),
  );

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Hapus Jadwal</DialogTitle>
        <DialogDescription>
          Apakah Anda yakin ingin menghapus jadwal "{schedule.label}"? Tindakan ini tidak dapat
          dibatalkan.
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <DialogClose render={<Button variant="outline" />}>Batal</DialogClose>
        <Button
          variant="destructive"
          onClick={() => deleteSchedule(schedule.id)}
          disabled={isPending}
        >
          Hapus
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

function ScheduleForm({
  label,
  onLabelChange,
  description,
  onDescriptionChange,
  time,
  onTimeChange,
  weekdays,
  onWeekdaysChange,
  businessDays,
  customSoundId,
  onCustomSoundIdChange,
  sounds,
  disabled,
  onSubmit,
}: {
  label: string;
  onLabelChange: (v: string) => void;
  description: string;
  onDescriptionChange: (v: string) => void;
  time: string;
  onTimeChange: (v: string) => void;
  weekdays: number[];
  onWeekdaysChange: (v: number[]) => void;
  businessDays: number[];
  customSoundId: number | null;
  onCustomSoundIdChange: (v: number | null) => void;
  sounds: CustomSound[];
  disabled: boolean;
  onSubmit: () => void;
}) {
  const soundItems = useMemo(
    () => [
      { label: "Suara Default", value: null },
      ...sounds.map((sound) => ({
        label: sound.label || sound.file_path,
        value: sound.id,
      })),
    ],
    [sounds],
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="schedule-label">Nama</Label>
        <Input
          id="schedule-label"
          placeholder="cth. Bel Masuk"
          value={label}
          onChange={(e) => onLabelChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSubmit()}
          disabled={disabled}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="schedule-time">Waktu</Label>
        <Input
          id="schedule-time"
          type="time"
          value={time}
          onChange={(e) => onTimeChange(e.target.value)}
          disabled={disabled}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="schedule-description">Deskripsi (opsional)</Label>
        <Textarea
          id="schedule-description"
          placeholder="cth. Bel tanda masuk kelas pagi"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          disabled={disabled}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Suara</Label>
        <Select
          items={soundItems}
          value={customSoundId}
          onValueChange={onCustomSoundIdChange}
          disabled={disabled}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Default" />
          </SelectTrigger>
          <SelectContent>
            {soundItems.map((item) => (
              <SelectItem key={item.value ?? "default"} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Hari Aktif</Label>
        <WeekdayPicker
          value={weekdays}
          onChange={onWeekdaysChange}
          availableDays={businessDays}
          disabled={disabled}
        />
      </div>
    </div>
  );
}

const PendingHeader = () => {
  return (
    <>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-lg font-medium">Jadwal</h1>
          <p className="text-sm text-muted-foreground">
            Kelola jadwal bel untuk preset yang sedang aktif.
          </p>
        </div>
        <Button disabled>
          <IconPlus data-icon="inline-start" />
          Buat Jadwal
        </Button>
      </div>

      <div className="flex flex-col gap-3">
        <div className="relative">
          <IconSearch className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input disabled placeholder="Cari jadwal..." className="pl-9" />
        </div>
        <ToggleGroup disabled value={["all"]} size="sm" variant="outline" className="w-full">
          <ToggleGroupItem value="all" className="flex-1">
            Semua
          </ToggleGroupItem>
          {DEFAULT_BUSINESS_DAYS.map((day) => {
            const label = WEEKDAYS.find((w) => w.value === day)?.label ?? String(day);
            return (
              <ToggleGroupItem key={day} value={String(day)} className="flex-1">
                {label}
              </ToggleGroupItem>
            );
          })}
        </ToggleGroup>
      </div>
    </>
  );
};

function PendingComponent() {
  return (
    <div className="mx-auto flex w-full flex-col gap-4 overflow-hidden">
      <PendingHeader />
      <div className="flex flex-col gap-2">
        {[0, 1, 2, 3, 4, 5].map((skeleton) => (
          <Skeleton className="h-24" key={skeleton} />
        ))}
      </div>
    </div>
  );
}

function ErrorComponent() {
  return (
    <div className="mx-auto flex w-full flex-col gap-4 overflow-hidden">
      <PendingHeader />
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-destructive p-8 text-center">
        <p className="text-sm text-destructive">Terjadi kesalahan saat memuat laman ini.</p>
      </div>
    </div>
  );
}
