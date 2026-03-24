import { Footer } from "@shared/components/layout/footer";
import { Header } from "@shared/components/layout/header";
import { Sidebar, SidebarProvider } from "@shared/components/layout/sidebar";
import { ScrollFade } from "@shared/components/scroll-fade";
import { UpdateChecker } from "@shared/components/update-checker";
import { Outlet } from "react-router";

export const Layout = () => {
  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-sidebar">
      <UpdateChecker />
      <SidebarProvider>
        <Header />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <div className="flex flex-1 flex-col overflow-hidden">
            <ScrollFade className="flex-1 rounded-l-3xl border border-r-0 bg-background/35">
              <div className="flex min-h-full p-8">
                <Outlet />
              </div>
            </ScrollFade>
            <Footer />
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
};
