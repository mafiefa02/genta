import {
  Home,
  Onboarding,
  PickProfiles,
  Profiles,
  Settings,
  Sounds,
} from "@pages/index";
import { Layout } from "@pages/layout";
import { getProfiles } from "@pages/pick-profiles/loaders/get-profiles";
import { SetupLayout } from "@pages/setup-layout";
import { createHashRouter } from "react-router";
import { profileCheckLoader } from "./loaders";

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
