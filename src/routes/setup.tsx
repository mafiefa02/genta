import bellAsset from "-/assets/bell3d.png";
import { Button } from "-/components/ui/button";
import { Input } from "-/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "-/components/ui/select";
import { presetsMutations } from "-/hooks/mutations/presets";
import { presetsQueries } from "-/hooks/queries/presets";
import type { SchedulePreset } from "-/lib/models";
import { IconArrowRight, IconBell, IconCalendar, IconClock } from "@tabler/icons-react";
import { useMutation, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/setup")({
  component: RouteComponent,
  loader: ({ context }) => {
    return context.queryClient.ensureQueryData(presetsQueries.list());
  },
});

function RouteComponent() {
  const { data: presets } = useSuspenseQuery(presetsQueries.list());
  const hasPresets = presets.length > 0;

  return (
    <main className="from-background via-background to-primary/5 relative flex h-dvh flex-col overflow-hidden bg-linear-to-b">
      <header className="relative z-10 flex items-center justify-center px-6 py-4">
        <span className="text-primary text-lg font-semibold tracking-tight">Genta</span>
      </header>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-11">
        <div className="relative mt-auto mb-6">
          <div className="bg-primary/10 absolute inset-0 scale-150 rounded-full blur-3xl" />
          <img
            src={bellAsset}
            alt="Bell"
            className="relative size-32 object-contain drop-shadow-xl"
          />
        </div>

        <div className="mb-8 flex max-w-md flex-col items-center gap-3 text-center">
          <h1 className="text-primary text-4xl font-bold tracking-tight sm:text-5xl">
            Selamat Datang
          </h1>
          <p className="text-muted-foreground text-base text-pretty">
            Atur profil jadwal pertama Anda untuk mulai menggunakan Genta untuk mengatur jadwal bel
            sekolah
          </p>
        </div>

        {hasPresets ? <SelectPresetControl presets={presets} /> : <CreatePresetControl />}

        <div className="mt-12 flex flex-col justify-center gap-4">
          <span className="text-muted-foreground text-center text-sm">
            Apa yang bisa Genta lakukan?
          </span>
          <div className="text-muted-foreground flex gap-6 text-xs sm:gap-8">
            <div className="flex items-center gap-1.5">
              <IconClock className="size-3.5" />
              <span>Atur jadwal bel</span>
            </div>
            <div className="flex items-center gap-1.5">
              <IconCalendar className="size-3.5" />
              <span>Banyak profil</span>
            </div>
            <div className="flex items-center gap-1.5">
              <IconBell className="size-3.5" />
              <span>Suara kustom</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

const CreatePresetControl = () => {
  const [name, setName] = useState("");
  const router = useRouter();
  const { mutate, isPending } = useMutation(
    presetsMutations.create({
      onSuccess: () => router.navigate({ to: "/schedules" }),
    }),
  );

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed || isPending) return;
    mutate({ name: trimmed });
  };

  return (
    <div className="mb-auto flex w-full max-w-sm flex-col gap-3">
      <div className="flex gap-2">
        <Input
          id="profile-name"
          type="text"
          placeholder="cth. Jadwal Reguler"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          disabled={isPending}
        />
        <Button
          onClick={handleSubmit}
          disabled={!name.trim() || isPending}
        >
          Mulai
          <IconArrowRight />
        </Button>
      </div>
    </div>
  );
};

const SelectPresetControl = ({ presets }: { presets: SchedulePreset[] }) => {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const router = useRouter();
  const { mutate, isPending } = useMutation(
    presetsMutations.activate({
      onSuccess: () => router.navigate({ to: "/schedules" }),
    }),
  );

  const handleSubmit = () => {
    if (selectedId == null || isPending) return;
    mutate(selectedId);
  };

  return (
    <div className="mb-auto flex w-full max-w-sm flex-col gap-3">
      <div className="flex gap-2">
        <Select
          value={selectedId}
          onValueChange={(val: number | null) => setSelectedId(val)}
        >
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Pilih profil..." />
          </SelectTrigger>
          <SelectContent>
            {presets.map((preset) => (
              <SelectItem
                key={preset.id}
                value={preset.id}
              >
                {preset.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          onClick={handleSubmit}
          disabled={selectedId == null || isPending}
        >
          Mulai
          <IconArrowRight />
        </Button>
      </div>
    </div>
  );
};
