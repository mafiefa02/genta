import { Layout } from "@pages/layout";
import { getProfiles } from "@pages/pick-profiles/loaders/get-profiles";
import { lazy } from "react";
import { createHashRouter } from "react-router";
import { profileCheckLoader } from "./loaders";

const Home = lazy(() =>
  import("./pages/home/view").then((m) => ({ default: m.Home })),
);
const Profiles = lazy(() =>
  import("./pages/profiles/view").then((m) => ({ default: m.Profiles })),
);
const Sounds = lazy(() =>
  import("./pages/sounds/view").then((m) => ({ default: m.Sounds })),
);
const Settings = lazy(() =>
  import("./pages/settings/view").then((m) => ({ default: m.Settings })),
);
const SetupLayout = lazy(() =>
  import("./pages/setup-layout").then((m) => ({ default: m.SetupLayout })),
);
const Onboarding = lazy(() =>
  import("./pages/onboarding/view").then((m) => ({ default: m.Onboarding })),
);
const PickProfiles = lazy(() =>
  import("./pages/pick-profiles/view").then((m) => ({
    default: m.PickProfiles,
  })),
);

export const router = createHashRouter([
  {
    loader: profileCheckLoader,
    Component: Layout,
    children: [
      { index: true, Component: Home },
      { path: "profiles", Component: Profiles },
      { path: "sounds", Component: Sounds },
      { path: "settings", Component: Settings },
    ],
  },
  {
    Component: SetupLayout,
    children: [
      {
        path: "onboarding",
        Component: Onboarding,
      },
      {
        path: "pick-profiles",
        loader: getProfiles,
        Component: PickProfiles,
      },
    ],
  },
]);
