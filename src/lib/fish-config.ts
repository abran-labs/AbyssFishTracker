import { FishSpecies, Mutation, StarLevel } from "./types";

export const FISH_SPECIES: FishSpecies[] = [
  // Common
  { name: "Blue Tang", rarity: "Common", baseValue: 14, minWeight: 0.32, maxWeight: 1.68, areas: ["Forgotten Deep", "Ocean"] },
  { name: "Clownfish", rarity: "Common", baseValue: 12, minWeight: 0.8, maxWeight: 3.36, areas: ["Forgotten Deep", "Ocean"] },
  { name: "Salmon", rarity: "Common", baseValue: 9, minWeight: 3.2, maxWeight: 13.44, areas: ["Forgotten Deep", "Ocean"] },
  { name: "Tang", rarity: "Common", baseValue: 12, minWeight: 0.32, maxWeight: 1.68, areas: ["Forgotten Deep"] },
  { name: "Pompano", rarity: "Common", baseValue: 14, minWeight: 1.6, maxWeight: 13.44, areas: ["Ancient Sands"] },
  { name: "Pacific Fanfish", rarity: "Common", baseValue: 20, minWeight: 4, maxWeight: 20.16, areas: ["Spirit Roots"] },
  { name: "Discus", rarity: "Common", baseValue: 25, minWeight: 4.8, maxWeight: 23.52, areas: ["Sunken Wilds"] },
  // Uncommon
  { name: "Pufferfish", rarity: "Uncommon", baseValue: 13, minWeight: 1.6, maxWeight: 6.72, areas: ["Forgotten Deep", "Ocean"] },
  { name: "Cod", rarity: "Uncommon", baseValue: 18, minWeight: 3.2, maxWeight: 20.16, areas: ["Ancient Sands"] },
  { name: "Napoleon", rarity: "Uncommon", baseValue: 20, minWeight: 8, maxWeight: 42, areas: ["Spirit Roots"] },
  { name: "Jellyfish", rarity: "Uncommon", baseValue: 35, minWeight: 3.2, maxWeight: 16.8, areas: ["Spirit Roots"] },
  { name: "Tambaqui", rarity: "Uncommon", baseValue: 18, minWeight: 24, maxWeight: 75.6, areas: ["Sunken Wilds"] },
  { name: "Trout", rarity: "Uncommon", baseValue: 24, minWeight: 8, maxWeight: 33.6, areas: ["Sunken Wilds"] },
  // Rare
  { name: "Sea Horse", rarity: "Rare", baseValue: 250, minWeight: 0.4, maxWeight: 1.68, areas: ["Ocean"] },
  { name: "Piranha", rarity: "Rare", baseValue: 44, minWeight: 4, maxWeight: 20.16, areas: ["Ocean", "Angler Cave", "Sunken Wilds"] },
  { name: "Blobfish", rarity: "Rare", baseValue: 75, minWeight: 6.4, maxWeight: 33.6, areas: ["Ocean", "Angler Cave"] },
  { name: "Lionfish", rarity: "Rare", baseValue: 20, minWeight: 1.6, maxWeight: 11.75, areas: ["Forgotten Deep"] },
  { name: "Mahi Mahi", rarity: "Rare", baseValue: 8, minWeight: 6.4, maxWeight: 33.6, areas: ["Forgotten Deep"] },
  { name: "Grouper", rarity: "Rare", baseValue: 28, minWeight: 4.8, maxWeight: 23.52, areas: ["Ancient Sands"] },
  { name: "Scorpionfish", rarity: "Rare", baseValue: 60, minWeight: 3.2, maxWeight: 13.44, areas: ["Ancient Sands"] },
  { name: "Blackfin Tuna", rarity: "Rare", baseValue: 60, minWeight: 4.8, maxWeight: 26.88, areas: ["Ancient Sands"] },
  { name: "Sunfish", rarity: "Rare", baseValue: 17, minWeight: 16, maxWeight: 67.2, areas: ["Spirit Roots"] },
  { name: "Narwhal", rarity: "Rare", baseValue: 18, minWeight: 24, maxWeight: 84, areas: ["Spirit Roots"] },
  { name: "Anglerfish", rarity: "Rare", baseValue: 35, minWeight: 24, maxWeight: 100.8, areas: ["Angler Cave"] },
  { name: "Sea Turtle", rarity: "Rare", baseValue: 20, minWeight: 48, maxWeight: 142.8, areas: ["Sunken Wilds"] },
  // Epic
  { name: "Barracuda", rarity: "Epic", baseValue: 20, minWeight: 4.8, maxWeight: 20.16, areas: ["Forgotten Deep"] },
  { name: "Cavefish", rarity: "Epic", baseValue: 22, minWeight: 24, maxWeight: 134.4, areas: ["Ancient Sands"] },
  { name: "Shark", rarity: "Epic", baseValue: 40, minWeight: 16, maxWeight: 117.6, areas: ["Ocean", "Ancient Sands"] },
  { name: "Sailfish", rarity: "Epic", baseValue: 40, minWeight: 24, maxWeight: 100.8, areas: ["Ocean", "Spirit Roots"] },
  { name: "Hammer Shark", rarity: "Epic", baseValue: 48, minWeight: 32, maxWeight: 134.4, areas: ["Spirit Roots"] },
  { name: "Jaguar Shark", rarity: "Epic", baseValue: 50, minWeight: 56, maxWeight: 184.8, areas: ["Sunken Wilds"] },
  { name: "Toucan Fish", rarity: "Epic", baseValue: 90, minWeight: 20, maxWeight: 67.2, areas: ["Sunken Wilds"] },
  // Legendary
  { name: "Bluefin Tuna", rarity: "Legendary", baseValue: 36, minWeight: 120, maxWeight: 336, areas: ["Ocean"] },
  { name: "Bigmouthfish", rarity: "Legendary", baseValue: 76, minWeight: 16, maxWeight: 84, areas: ["Ancient Sands"] },
  { name: "Ancient Shark", rarity: "Legendary", baseValue: 50, minWeight: 72, maxWeight: 218.4, areas: ["Ancient Sands"] },
  { name: "Eyefish", rarity: "Legendary", baseValue: 160, minWeight: 16, maxWeight: 75.6, areas: ["Spirit Roots"] },
  { name: "Sacabambaspis", rarity: "Legendary", baseValue: 150, minWeight: 17.6, maxWeight: 70.56, areas: ["Sunken Wilds"] },
];

export const MUTATIONS: Mutation[] = [
  { name: "None", multiplier: 1.0, sizeMultiplier: 1.0 },
  { name: "Poop", multiplier: 0.33, sizeMultiplier: 1.333 },
  { name: "Rock", multiplier: 1.0, sizeMultiplier: 1.2, area: "Forgotten Deep" },
  { name: "Moss", multiplier: 1.1, sizeMultiplier: 1.0, area: "Forgotten Deep" },
  { name: "Coral", multiplier: 1.1, sizeMultiplier: 0.8 },
  { name: "Metal", multiplier: 1.2, sizeMultiplier: 1.2 },
  { name: "Sand", multiplier: 1.25, sizeMultiplier: 1.0, area: "Ancient Sands" },
  { name: "Albino", multiplier: 1.3, sizeMultiplier: 1.0 },
  { name: "Transparent", multiplier: 1.35, sizeMultiplier: 1.0 },
  { name: "Cactus", multiplier: 1.45, sizeMultiplier: 1.3, area: "Ancient Sands" },
  { name: "Banana", multiplier: 1.5, sizeMultiplier: 1.0, area: "Sunken Wilds" },
  { name: "Spirit", multiplier: 1.7, sizeMultiplier: 1.2, area: "Spirit Roots" },
  { name: "Fossil", multiplier: 1.75, sizeMultiplier: 0.9, area: "Ancient Sands" },
  { name: "Golden", multiplier: 2.0, sizeMultiplier: 1.2 },
  { name: "Negative", multiplier: 2.0, sizeMultiplier: 1.0 },
  { name: "Fairy", multiplier: 2.3, sizeMultiplier: 1.2, area: "Spirit Roots" },
  { name: "Invisible", multiplier: 2.4, sizeMultiplier: 1.4 },
  { name: "Liquid", multiplier: 2.5, sizeMultiplier: 1.3 },
  { name: "Grounded", multiplier: 2.8, sizeMultiplier: 1.2, area: "Sunken Wilds" },
  { name: "Neon", multiplier: 2.8, sizeMultiplier: 1.2 },
  { name: "Ultraviolet", multiplier: 3.6, sizeMultiplier: 1.8 },
  { name: "Rooted", multiplier: 3.6, sizeMultiplier: 1.5, area: "Spirit Roots" },
  { name: "Toxic", multiplier: 3.75, sizeMultiplier: 1.2 },
  { name: "Jade", multiplier: 4, sizeMultiplier: 1.0, area: "Sunken Wilds" },
  { name: "Cupid", multiplier: 1.4, sizeMultiplier: 1.0 },
  { name: "Lonely", multiplier: 2.0, sizeMultiplier: 1.0 },
  { name: "Shadow", multiplier: 6.66, sizeMultiplier: 1.11 },
  { name: "Angelic", multiplier: 7.77, sizeMultiplier: 1.4 },
  { name: "Abyssal", multiplier: 8.5, sizeMultiplier: 1.5 },
];

export const STAR_LEVELS: StarLevel[] = [
  { label: "Dead", value: 0, multiplier: 0.2 },
  { label: "1 Star", value: 1, multiplier: 0.5 },
  { label: "2 Stars", value: 2, multiplier: 0.75 },
  { label: "3 Stars", value: 3, multiplier: 1.0 },
];

export function getAvailableMutations(fish: FishSpecies): Mutation[] {
  return MUTATIONS.filter(
    (m) => !m.area || fish.areas.includes(m.area)
  );
}

export const RARITY_COLORS: Record<string, string> = {
  Common: "rgb(114, 126, 154)",
  Uncommon: "rgb(135, 203, 116)",
  Rare: "rgb(89, 191, 255)",
  Epic: "rgb(147, 123, 226)",
  Legendary: "rgb(241, 174, 65)",
};

export const MUTATION_COLORS: Record<string, string> = {
  Poop: "rgb(85, 68, 56)",
  Rock: "rgb(88, 90, 94)",
  Moss: "rgb(116, 138, 70)",
  Coral: "rgb(109, 189, 207)",
  Metal: "rgb(139, 157, 167)",
  Sand: "rgb(240, 215, 181)",
  Albino: "rgb(198, 198, 198)",
  Transparent: "rgb(167, 216, 152)",
  Cactus: "rgb(108, 120, 74)",
  Banana: "rgb(218, 172, 55)",
  Spirit: "rgb(171, 231, 221)",
  Fossil: "rgb(185, 163, 144)",
  Golden: "rgb(235, 194, 123)",
  Negative: "rgb(84, 153, 238)",
  Fairy: "rgb(255, 153, 194)",
  Invisible: "rgb(209, 243, 241)",
  Liquid: "rgb(69, 223, 254)",
  Grounded: "rgb(111, 168, 90)",
  Neon: "rgb(255, 255, 255)",
  Ultraviolet: "rgb(232, 179, 255)",
  Rooted: "rgb(134, 192, 255)",
  Toxic: "rgb(143, 204, 93)",
  Jade: "rgb(143, 223, 156)",
  Cupid: "rgb(255, 105, 180)",
  Lonely: "rgb(106, 76, 199)",
  Shadow: "rgb(38, 38, 38)",
  Angelic: "rgb(255, 242, 175)",
  Abyssal: "rgb(92, 96, 221)",
};

export const STAR_COLOR = "#FDC85D";

export function getRarityColor(fishName: string): string | undefined {
  const fish = FISH_SPECIES.find((f) => f.name === fishName);
  return fish ? RARITY_COLORS[fish.rarity] : undefined;
}

const WEIGHT_COLORS = {
  small: "rgb(168, 168, 168)",
  normal: "rgb(244, 244, 188)",
  big: "rgb(212, 182, 113)",
  giant: "rgb(236, 108, 76)",
};

export function getRankColor(rank: number): string {
  if (rank === 1) return "rgb(241, 196, 65)";   // gold
  if (rank === 2) return "rgb(186, 192, 200)";  // silver
  if (rank === 3) return "rgb(205, 153, 96)";   // bronze
  if (rank <= 6) return "rgb(160, 160, 170)";
  if (rank <= 12) return "rgb(120, 120, 135)";
  return "rgb(90, 90, 105)";
}

export function getValueColor(value: number, allValues: number[]): string {
  if (allValues.length === 0) return "rgb(160, 160, 170)";
  const max = Math.max(...allValues);
  const min = Math.min(...allValues);
  const range = max - min;
  if (range === 0) return "rgb(241, 196, 65)";
  const t = (value - min) / range;
  // muted gray → warm gold
  const r = Math.round(130 + t * (241 - 130));
  const g = Math.round(130 + t * (196 - 130));
  const b = Math.round(145 + t * (65 - 145));
  return `rgb(${r}, ${g}, ${b})`;
}

export function getOptimizationColor(opt: number): string {
  // red (<30) → yellow (~50) → green (>80)
  if (opt <= 30) {
    const t = opt / 30;
    const r = Math.round(220 + t * (230 - 220));
    const g = Math.round(70 + t * (190 - 70));
    const b = Math.round(70 + t * (60 - 70));
    return `rgb(${r}, ${g}, ${b})`;
  }
  if (opt <= 60) {
    const t = (opt - 30) / 30;
    const r = Math.round(230 - t * (230 - 100));
    const g = Math.round(190 + t * (210 - 190));
    const b = Math.round(60 + t * (90 - 60));
    return `rgb(${r}, ${g}, ${b})`;
  }
  const t = Math.min((opt - 60) / 40, 1);
  const r = Math.round(100 - t * (100 - 80));
  const g = Math.round(210 + t * (230 - 210));
  const b = Math.round(90 - t * (90 - 80));
  return `rgb(${r}, ${g}, ${b})`;
}

export function getWeightColor(weight: number, fishName: string): string {
  const fish = FISH_SPECIES.find((f) => f.name === fishName);
  if (!fish) return WEIGHT_COLORS.normal;
  const range = fish.maxWeight - fish.minWeight;
  if (range === 0) return WEIGHT_COLORS.normal;
  const position = (weight - fish.minWeight) / range;
  if (position < 0.25) return WEIGHT_COLORS.small;
  if (position < 0.5) return WEIGHT_COLORS.normal;
  if (position < 0.75) return WEIGHT_COLORS.big;
  return WEIGHT_COLORS.giant;
}

