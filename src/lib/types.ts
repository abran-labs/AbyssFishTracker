export type FishArea =
  | "Forgotten Deep"
  | "Ocean"
  | "Ancient Sands"
  | "Spirit Roots"
  | "Angler Cave"
  | "Sunken Wilds";

export interface FishSpecies {
  name: string;
  rarity: "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary";
  baseValue: number;
  minWeight: number;
  maxWeight: number;
  areas: FishArea[];
}

export interface Mutation {
  name: string;
  multiplier: number;
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

export interface PondSettings {
  size: number;
}
