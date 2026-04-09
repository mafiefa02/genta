import { useTheme } from "-/components/theme-provider";
import { Avatar, AvatarFallback } from "-/components/ui/avatar";
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
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "-/components/ui/dropdown-menu";
import { Input } from "-/components/ui/input";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "-/components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipTrigger } from "-/components/ui/tooltip";
import { presetsMutations } from "-/hooks/mutations/presets";
import { configQueries } from "-/hooks/queries/config";
import { presetsQueries } from "-/hooks/queries/presets";
import {
  IconCalendarUser,
  IconCheck,
  IconClock,
  IconHome,
  IconMenu2,
  IconMessage2Star,
  IconMusic,
  IconPlus,
  IconSettings,
} from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "@tanstack/react-router";
import { useState } from "react";

const SIDEBAR_MENU = [
  { label: "Home", icon: IconHome, path: "/" },
  { label: "Schedules", icon: IconClock, path: "/schedules" },
  { label: "Schedule Presets", icon: IconCalendarUser, path: "/presets" },
  { label: "Custom Sounds", icon: IconMusic, path: "/sounds" },
  { label: "Settings", icon: IconSettings, path: "/settings" },
];

export const AppSidebar = () => {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <PresetSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavigationMenu menus={SIDEBAR_MENU} />
      </SidebarContent>
      <SidebarFooter>
        <Footer />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
};

const PresetSwitcher = () => {
  const { isMobile, state } = useSidebar();
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
    create(trimmed);
  };

  if (!presets || !activePreset) {
    return null;
  }

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <Tooltip disabled={isMobile || state === "expanded"}>
              <TooltipContent side="right">Change preset</TooltipContent>
              <TooltipTrigger
                render={<DropdownMenuTrigger render={<SidebarMenuButton size="lg" />} />}
              >
                <Avatar>
                  <AvatarFallback>
                    <IconMessage2Star />
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{activePreset.name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {activePreset.description ?? "Schedule preset"}
                  </span>
                </div>
              </TooltipTrigger>
            </Tooltip>
            <DropdownMenuContent side="right">
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Presets
                </DropdownMenuLabel>
                {presets.map((preset) => (
                  <DropdownMenuItem
                    key={preset.id}
                    onClick={() => activate(preset.id)}
                    className="gap-2 p-2"
                  >
                    <div className="flex size-6 items-center justify-center rounded-md border">
                      <IconMessage2Star className="size-3.5 shrink-0" />
                    </div>
                    {preset.name}
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
                  <span>Create a new preset</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a new profile</DialogTitle>
            <DialogDescription>Enter a name for your new schedule profile.</DialogDescription>
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
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

const NavigationMenu = ({ menus }: { menus: typeof SIDEBAR_MENU }) => {
  const location = useLocation();
  const isMenuActive = (pathname: string) => location.pathname === pathname;
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Genta&apos;s Menu</SidebarGroupLabel>
      <SidebarMenu>
        {menus.map((menu) => (
          <SidebarMenuItem key={menu.path}>
            <SidebarMenuButton
              tooltip={menu.label}
              isActive={isMenuActive(menu.path)}
              render={<Link to={menu.path} />}
            >
              <menu.icon />
              <span>{menu.label}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
};

const Footer = () => {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger render={<SidebarMenuButton />}>
            <IconMenu2 />
            <span>Preferences</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Appearance</DropdownMenuLabel>
              <SidebarThemeToggle />
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
};

const APP_THEMES = ["dark", "light", "system"] as const;
const SidebarThemeToggle = () => {
  const { theme: activeTheme, setTheme: setActiveTheme } = useTheme();
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>Theme</DropdownMenuSubTrigger>
      <DropdownMenuPortal>
        <DropdownMenuSubContent>
          {APP_THEMES.map((theme) => (
            <DropdownMenuItem onClick={() => setActiveTheme(theme)} key={theme}>
              {theme.charAt(0).toUpperCase() + theme.slice(1)}
              {theme === activeTheme && (
                <DropdownMenuShortcut>
                  <IconCheck />
                </DropdownMenuShortcut>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  );
};
