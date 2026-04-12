import { SidebarUpdateChecker } from "-/components/sidebar-update-checker";
import { useTheme } from "-/components/theme-provider";
import { Avatar, AvatarFallback } from "-/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "-/components/ui/dropdown-menu";
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
} from "-/components/ui/sidebar";
import {
  IconBell,
  IconCalendarUser,
  IconCheck,
  IconClock,
  IconMenu2,
  IconMusic,
} from "@tabler/icons-react";
import { Link, useLocation } from "@tanstack/react-router";

const SIDEBAR_MENU = [
  // { label: "Beranda", icon: IconHome, path: "/" },
  { label: "Jadwal", icon: IconClock, path: "/schedules" },
  { label: "Preset Jadwal", icon: IconCalendarUser, path: "/presets" },
  { label: "Suara Kustom", icon: IconMusic, path: "/sounds" },
  // { label: "Pengaturan", icon: IconSettings, path: "/settings" },
];

export const AppSidebar = () => {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg">
              <Avatar>
                <AvatarFallback className="bg-primary text-background dark:text-foreground border">
                  <IconBell />
                </AvatarFallback>
              </Avatar>
              <div className="grid leading-none">
                <span className="font-semibold">Genta</span>
                <span className="text-muted-foreground line-clamp-1 text-xs text-ellipsis">
                  Aplikasi Bel
                </span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
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

const NavigationMenu = ({ menus }: { menus: typeof SIDEBAR_MENU }) => {
  const location = useLocation();
  const isMenuActive = (pathname: string) => location.pathname === pathname;
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Navigasi</SidebarGroupLabel>
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
          <DropdownMenuTrigger render={<SidebarMenuButton tooltip="Preferensi" />}>
            <IconMenu2 />
            <span>Preferensi</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Tampilan</DropdownMenuLabel>
              <SidebarThemeToggle />
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarUpdateChecker />
      </SidebarMenuItem>
    </SidebarMenu>
  );
};

const APP_THEMES = [
  { id: "dark", label: "Gelap" },
  { id: "light", label: "Terang" },
  { id: "system", label: "Sistem" },
] as const;
const SidebarThemeToggle = () => {
  const { theme: activeTheme, setTheme: setActiveTheme } = useTheme();
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>Tema</DropdownMenuSubTrigger>
      <DropdownMenuPortal>
        <DropdownMenuSubContent>
          {APP_THEMES.map((theme) => (
            <DropdownMenuItem
              onClick={() => setActiveTheme(theme.id)}
              key={theme.id}
            >
              {theme.label}
              {theme.id === activeTheme && (
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
