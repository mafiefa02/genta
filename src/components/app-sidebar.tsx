import { useTheme } from "-/components/theme-provider";
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
  IconCalendarUser,
  IconCheck,
  IconClock,
  IconMenu2,
  IconMessage2Star,
  IconMusic,
  IconPlus,
  IconSettings,
} from "@tabler/icons-react";
import { Link, useLocation } from "@tanstack/react-router";
import { useState } from "react";

import { Avatar, AvatarFallback } from "./ui/avatar";

const SIDEBAR_MENU = [
  { label: "Schedules", icon: IconClock, path: "/schedules" },
  { label: "Profiles", icon: IconCalendarUser, path: "/profiles" },
  { label: "Custom Sounds", icon: IconMusic, path: "/sounds" },
  { label: "Settings", icon: IconSettings, path: "/settings" },
];

const TEAMS = [
  {
    name: "Acme Inc",
    plan: "Enterprise",
  },
  {
    name: "Acme Corp.",
    plan: "Startup",
  },
  {
    name: "Evil Corp.",
    plan: "Free",
  },
];

export const AppSidebar = () => {
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <ProfileSwitcher teams={TEAMS} />
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

const ProfileSwitcher = ({ teams }: { teams: typeof TEAMS }) => {
  const [activeTeam, setActiveTeam] = useState(teams[0]);

  if (!activeTeam) {
    return null;
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger render={<SidebarMenuButton size="lg" />}>
            <Avatar>
              <AvatarFallback>
                <IconMessage2Star />
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{activeTeam.name}</span>
              <span className="truncate text-xs text-muted-foreground">{activeTeam.plan}</span>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Profiles
              </DropdownMenuLabel>
              {teams.map((team) => (
                <DropdownMenuItem
                  key={team.name}
                  onClick={() => setActiveTeam(team)}
                  className="gap-2 p-2"
                >
                  <div className="flex size-6 items-center justify-center rounded-md border">
                    <IconMessage2Star className="size-3.5 shrink-0" />
                  </div>
                  {team.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <IconPlus className="size-4" />
                <span>Create a new profile</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
};

const NavigationMenu = ({ menus }: { menus: typeof SIDEBAR_MENU }) => {
  const location = useLocation();
  const isMenuActive = (pathname: string) => location.pathname.startsWith(pathname);
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
          <DropdownMenuContent>
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
