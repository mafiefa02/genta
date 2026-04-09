import bellAsset from "-/assets/bell3d.png";
import { Button } from "-/components/ui/button";
import { Input } from "-/components/ui/input";
import { IconArrowRight, IconBell, IconCalendar, IconClock } from "@tabler/icons-react";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/setup")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <main className="from-backgroun relative flex h-dvh flex-col overflow-hidden bg-linear-to-b via-background to-primary/5">
      <header className="relative z-10 flex items-center justify-center px-6 py-4">
        <span className="text-lg font-semibold tracking-tight text-primary">Genta</span>
      </header>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-11">
        <div className="relative mt-auto mb-6">
          <div className="absolute inset-0 scale-150 rounded-full bg-primary/10 blur-3xl" />
          <img
            src={bellAsset}
            alt="Bell"
            className="relative size-32 object-contain drop-shadow-xl"
          />
        </div>

        <div className="mb-8 flex max-w-md flex-col items-center gap-3 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-primary sm:text-5xl">
            Selamat Datang
          </h1>
          <p className="text-base text-pretty text-muted-foreground">
            Buat profil jadwal pertama Anda untuk mulai menggunakan Genta untuk mengatur jadwal bel
            sekolah
          </p>
        </div>

        <div className="mb-auto flex w-full max-w-sm flex-col gap-3">
          <div className="flex gap-2">
            <Input id="profile-name" type="text" placeholder="cth. Jadwal Reguler" />
            <Button>
              Mulai
              <IconArrowRight />
            </Button>
          </div>
        </div>

        <div className="mt-12 flex flex-col justify-center gap-4">
          <span className="text-center text-sm text-muted-foreground">
            Apa yang bisa Genta lakukan?
          </span>
          <div className="flex gap-6 text-xs text-muted-foreground sm:gap-8">
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
