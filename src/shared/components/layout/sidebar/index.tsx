import { GlobalProfileSelector } from "@features/profiles/components/global-profile-selector";
import { Button } from "@shared/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from "@shared/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@shared/components/ui/field";
import { cn } from "@shared/lib/utils";
import {
  CalendarIcon,
  MenuIcon,
  PanelLeftClose,
  PanelLeftOpen,
  SettingsIcon,
  TimerIcon,
  Volume2Icon,
} from "lucide-react";
import { useCallback, useState } from "react";
import { Link, useLocation } from "react-router";
import { SidebarContext, useSidebar } from "./context";

const MENUS = [
  { label: "Schedules", to: "/", icon: <TimerIcon /> },
  { label: "Profiles", to: "/profiles", icon: <CalendarIcon /> },
  { label: "Sounds", to: "/sounds", icon: <Volume2Icon /> },
  { label: "Settings", to: "/settings", icon: <SettingsIcon /> },
];

interface SidebarItemProps {
  label: string;
  to: string;
  icon: React.ReactNode;
}

const SidebarItem = ({ label, to, icon }: SidebarItemProps) => {
  const { isExpanded } = useSidebar();
  const { pathname } = useLocation();
  const isActive = pathname === to;
  return (
    <Link to={to}>
      <Button
        className={cn("w-full", isExpanded && "justify-start")}
        variant={isActive ? "outline" : "ghost"}
        size={isExpanded ? "default" : "icon"}
      >
        {icon}
        {isExpanded && <p>{label}</p>}
      </Button>
    </Link>
  );
};

const SidebarMenuPopover = () => {
  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            size="icon"
          />
        }
      >
        <MenuIcon className="size-4" />
      </DialogTrigger>
      <DialogPopup>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <DialogPanel>
          <Field>
            <FieldLabel>Active Profile</FieldLabel>
            <GlobalProfileSelector />
            <FieldDescription>
              Navigate to the profiles page to create a new profile
            </FieldDescription>
          </Field>
        </DialogPanel>
        <DialogFooter>
          <DialogClose render={<Button variant="default" />}>
            Confirm
          </DialogClose>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
};

const SidebarMenu = () => {
  const { isExpanded } = useSidebar();
  return isExpanded ? <GlobalProfileSelector /> : <SidebarMenuPopover />;
};

export const SidebarControlButton = () => {
  const { isExpanded, setIsExpanded } = useSidebar();
  const handleToggle = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, [setIsExpanded]);
  return (
    <Button
      variant="ghost"
      size="icon"
      className="pointer-events-auto"
      onClick={handleToggle}
    >
      {isExpanded ? <PanelLeftClose /> : <PanelLeftOpen />}
    </Button>
  );
};

export const Sidebar = () => {
  const { isExpanded } = useSidebar();
  return (
    <aside
      data-tauri-drag-region
      className={cn(
        "flex h-full flex-col items-center justify-between px-4 pt-2 pb-3",
        isExpanded && "min-w-52",
      )}
    >
      <div className="flex w-full flex-col gap-3">
        {MENUS.map((menu) => (
          <SidebarItem
            key={menu.to}
            {...menu}
          />
        ))}
      </div>
      <SidebarMenu />
    </aside>
  );
};

export const SidebarProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  return (
    <SidebarContext.Provider value={{ isExpanded, setIsExpanded }}>
      {children}
    </SidebarContext.Provider>
  );
};
