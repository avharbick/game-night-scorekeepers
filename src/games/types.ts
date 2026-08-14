import type { ComponentType } from "react";

export type GameModuleProps = {
  onExit: () => void;
};

export type GameModule = {
  id: string;
  name: string;
  description: string;
  detail: string;
  icon: string;
  Component: ComponentType<GameModuleProps>;
};
