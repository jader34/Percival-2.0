import type { AppState, applyAction, getSheet } from "../session/state.ts";
export type SessionAction = Parameters<typeof applyAction>[1];
export type Sheet = ReturnType<typeof getSheet>;
export type Dialog =
  | {
      kind:
        | "damage"
        | "heal"
        | "temp"
        | "hit-dice"
        | "mount-damage"
        | "mount-heal"
        | "mount-temp"
        | "mount-hit-dice"
        | "hands"
        | "smite"
        | "blessing"
        | "absorb"
        | "rest"
        | "xp"
        | "settings"
        | "level"
        | "potion";
    }
  | { kind: "spell"; id: string };
export interface PanelProps {
  state: AppState;
  sheet: Sheet;
  act: (action: SessionAction, message?: string) => boolean;
  open: (dialog: Dialog) => void;
}
export const signed = (value: number) => `${value >= 0 ? "+" : ""}${value}`;
export const abilityNames = {
  str: "Força",
  dex: "Destreza",
  con: "Constituição",
  int: "Inteligência",
  wis: "Sabedoria",
  cha: "Carisma",
};
