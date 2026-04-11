import { Button } from "-/components/ui/button";
import {
  Dialog,
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "-/components/ui/dropdown-menu";
import { Input } from "-/components/ui/input";
import { SidebarTrigger } from "-/components/ui/sidebar";
import { presetsMutations } from "-/hooks/mutations/presets";
import { configQueries } from "-/hooks/queries/config";
import { presetsQueries } from "-/hooks/queries/presets";
import { IconCalendarUser, IconCheck, IconChevronDown, IconPlus } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";

export const AppHeader = () => {
  return (
    <header className="sticky top-0 flex items-center justify-between border-b border-sidebar-border bg-sidebar px-4 py-2">
      <div className="mx-auto flex flex-1 justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <SidebarTrigger variant="outline" />
          <PresetSwitcher />
        </div>
        <CurrentLocalTime />
      </div>
    </header>
  );
};

const PresetSwitcher = () => {
  const { data: presets } = useQuery(presetsQueries.list());
  const { data: activePresetId } = useQuery(configQueries.activePresetId());
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");

  const activePreset = presets?.find((p) => p.id === activePresetId);

  const { mutate: activate } = useMutation(
    presetsMutations.activate({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: configQueries.keys.all });
      },
    }),
  );

  const { mutate: create, isPending: isCreating } = useMutation(
    presetsMutations.create({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: presetsQueries.keys.all });
        queryClient.invalidateQueries({ queryKey: configQueries.keys.all });
        setNewName("");
        setDialogOpen(false);
      },
    }),
  );

  const handleCreate = () => {
    const trimmed = newName.trim();
    if (!trimmed || isCreating) return;
    create({ name: trimmed });
  };

  if (!presets || !activePreset) {
    return null;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button size="sm" variant="outline" className="max-w-56 min-w-0" />}
        >
          <IconCalendarUser className="shrink-0" />
          <span className="truncate">{activePreset.name}</span>
          <IconChevronDown className="shrink-0" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Preset jadwal
            </DropdownMenuLabel>
            {presets.map((preset) => (
              <DropdownMenuItem
                key={preset.id}
                onClick={() => activate(preset.id)}
                className="gap-2 p-2"
              >
                <p className="truncate">{preset.name}</p>
                {preset.id === activePresetId && (
                  <DropdownMenuShortcut>
                    <IconCheck className="size-4" />
                  </DropdownMenuShortcut>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => setDialogOpen(true)}>
              <IconPlus className="size-4" />
              <span>Buat preset baru</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Preset Baru</DialogTitle>
            <DialogDescription>Masukkan nama untuk preset baru yang akan dibuat</DialogDescription>
          </DialogHeader>
          <Input
            placeholder="cth. Jadwal Reguler"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            disabled={isCreating}
          />
          <DialogFooter>
            <Button onClick={handleCreate} disabled={!newName.trim() || isCreating}>
              Buat preset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

const timeFormatter = new Intl.DateTimeFormat("id-ID", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
  timeZoneName: "short",
});

const CurrentLocalTime = () => {
  const [time, setTime] = useState(() => timeFormatter.format(new Date()));
  const rafId = useRef(0);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const now = new Date();
      setTime(timeFormatter.format(now));
      timer = setTimeout(tick, 1000 - now.getMilliseconds());
    };
    timer = setTimeout(tick, 1000 - new Date().getMilliseconds());
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(rafId.current);
    };
  }, []);

  return (
    <div className="grid gap-0 text-right text-xs leading-none">
      <span className="font-medium">Waktu Lokal</span>
      <span className="text-muted-foreground tabular-nums">{time}</span>
    </div>
  );
};
