export type FishArea =
  | "Forgotten Deep"
  | "Ocean"
  | "Ancient Sands"
  | "Spirit Roots"
  | "Angler Cave"
  | "Sunken Wilds"
  | "Gloomspore Valley";

export interface FishSpecies {
  name: string;
  rarity: "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary" | "Mythical" | "Secret";
  baseValue: number;
  minWeight: number;
  maxWeight: number;
  areas: FishArea[];
}

export interface Mutation {
  name: string;
  multiplier: number;
  sizeMultiplier: number;
  area?: FishArea;
}

export interface StarLevel {
  label: string;
  value: number;
  multiplier: number;
}

export interface FishEntry {
  id: string;
  fishName: string;
  weight: number;
  stars: number;
  mutation: string;
  value: number;
  optimization: number;
  createdAt: string;
  updatedAt: string;
}

export interface GlobalSettings {
  race: string;
  artifact1: string;
  artifact2: string;
  artifact3: string;
}

export interface PondSettings {
  roeStorageLevel: number;   // 0-6
  decorationLevel: number;   // 0-6
}

