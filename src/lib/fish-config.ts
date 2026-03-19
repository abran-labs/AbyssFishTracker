import { FishSpecies, Mutation, StarLevel } from "./types";

export const FISH_SPECIES: FishSpecies[] = [
  // Common
  { name: "Blue Tang", rarity: "Common", baseValue: 14, baseMinWeight: 0.5, baseMaxWeight: 1, areas: ["Forgotten Deep", "Ocean"] },
  { name: "Clownfish", rarity: "Common", baseValue: 12, baseMinWeight: 1, baseMaxWeight: 2, areas: ["Forgotten Deep", "Ocean"] },
  { name: "Salmon", rarity: "Common", baseValue: 9, baseMinWeight: 4, baseMaxWeight: 8, areas: ["Forgotten Deep", "Ocean"] },
  { name: "Tang", rarity: "Common", baseValue: 12, baseMinWeight: 0.5, baseMaxWeight: 1, areas: ["Forgotten Deep"] },
  { name: "Pompano", rarity: "Common", baseValue: 14, baseMinWeight: 2, baseMaxWeight: 8, areas: ["Ancient Sands"] },
  { name: "Pacific Fanfish", rarity: "Common", baseValue: 20, baseMinWeight: 5, baseMaxWeight: 12, areas: ["Spirit Roots"] },
  { name: "Discus", rarity: "Common", baseValue: 25, baseMinWeight: 6, baseMaxWeight: 14, areas: ["Sunken Wilds"] },
  // Uncommon
  { name: "Pufferfish", rarity: "Uncommon", baseValue: 13, baseMinWeight: 2, baseMaxWeight: 4, areas: ["Forgotten Deep", "Ocean"] },
  { name: "Inflated Pufferfish", rarity: "Uncommon", baseValue: 26, baseMinWeight: 2, baseMaxWeight: 4, areas: ["Forgotten Deep", "Ocean"] },
  { name: "Cod", rarity: "Uncommon", baseValue: 18, baseMinWeight: 4, baseMaxWeight: 12, areas: ["Ancient Sands"] },
  { name: "Napoleon", rarity: "Uncommon", baseValue: 20, baseMinWeight: 10, baseMaxWeight: 25, areas: ["Spirit Roots"] },
  { name: "Jellyfish", rarity: "Uncommon", baseValue: 35, baseMinWeight: 4, baseMaxWeight: 10, areas: ["Spirit Roots"] },
  { name: "Tambaqui", rarity: "Uncommon", baseValue: 18, baseMinWeight: 30, baseMaxWeight: 45, areas: ["Sunken Wilds"] },
  { name: "Trout", rarity: "Uncommon", baseValue: 24, baseMinWeight: 10, baseMaxWeight: 20, areas: ["Sunken Wilds"] },
  { name: "Blackfin Tuna", rarity: "Uncommon", baseValue: 60, baseMinWeight: 6, baseMaxWeight: 16, areas: ["Ancient Sands"] },
  // Rare
  { name: "Sea Horse", rarity: "Rare", baseValue: 250, baseMinWeight: 0.5, baseMaxWeight: 1, areas: ["Ocean"] },
  { name: "Piranha", rarity: "Rare", baseValue: 44, baseMinWeight: 5, baseMaxWeight: 12, areas: ["Ocean", "Angler Cave", "Sunken Wilds"] },
  { name: "Blobfish", rarity: "Rare", baseValue: 75, baseMinWeight: 8, baseMaxWeight: 20, areas: ["Ocean", "Angler Cave"] },
  { name: "Lionfish", rarity: "Rare", baseValue: 20, baseMinWeight: 2, baseMaxWeight: 6, areas: ["Forgotten Deep"] },
  { name: "Mahi Mahi", rarity: "Rare", baseValue: 8, baseMinWeight: 8, baseMaxWeight: 20, areas: ["Forgotten Deep"] },
  { name: "Grouper", rarity: "Rare", baseValue: 28, baseMinWeight: 6, baseMaxWeight: 14, areas: ["Ancient Sands"] },
  { name: "Scorpionfish", rarity: "Rare", baseValue: 60, baseMinWeight: 4, baseMaxWeight: 8, areas: ["Ancient Sands"] },
  { name: "Sunfish", rarity: "Rare", baseValue: 17, baseMinWeight: 20, baseMaxWeight: 40, areas: ["Spirit Roots"] },
  { name: "Narwhal", rarity: "Rare", baseValue: 18, baseMinWeight: 30, baseMaxWeight: 50, areas: ["Spirit Roots"] },
  { name: "Anglerfish", rarity: "Rare", baseValue: 35, baseMinWeight: 30, baseMaxWeight: 60, areas: ["Angler Cave"] },
  { name: "Sea Turtle", rarity: "Rare", baseValue: 20, baseMinWeight: 60, baseMaxWeight: 85, areas: ["Sunken Wilds"] },
  // Epic
  { name: "Barracuda", rarity: "Epic", baseValue: 20, baseMinWeight: 6, baseMaxWeight: 12, areas: ["Forgotten Deep"] },
  { name: "Cavefish", rarity: "Epic", baseValue: 22, baseMinWeight: 30, baseMaxWeight: 80, areas: ["Ancient Sands"] },
  { name: "Shark", rarity: "Epic", baseValue: 40, baseMinWeight: 20, baseMaxWeight: 70, areas: ["Ocean", "Ancient Sands"] },
  { name: "Sailfish", rarity: "Epic", baseValue: 40, baseMinWeight: 30, baseMaxWeight: 60, areas: ["Ocean", "Spirit Roots"] },
  { name: "Hammer Shark", rarity: "Epic", baseValue: 48, baseMinWeight: 40, baseMaxWeight: 80, areas: ["Spirit Roots"] },
  { name: "Jaguar Shark", rarity: "Epic", baseValue: 50, baseMinWeight: 70, baseMaxWeight: 110, areas: ["Sunken Wilds"] },
  { name: "Toucan Fish", rarity: "Epic", baseValue: 90, baseMinWeight: 25, baseMaxWeight: 40, areas: ["Sunken Wilds"] },
  // Legendary
  { name: "Bluefin Tuna", rarity: "Legendary", baseValue: 36, baseMinWeight: 150, baseMaxWeight: 200, areas: ["Ocean"] },
  { name: "Bigmouthfish", rarity: "Legendary", baseValue: 76, baseMinWeight: 20, baseMaxWeight: 50, areas: ["Ancient Sands"] },
  { name: "Ancient Shark", rarity: "Legendary", baseValue: 50, baseMinWeight: 90, baseMaxWeight: 130, areas: ["Ancient Sands"] },
  { name: "Eyefish", rarity: "Legendary", baseValue: 160, baseMinWeight: 20, baseMaxWeight: 45, areas: ["Spirit Roots"] },
  { name: "Sacabambaspis", rarity: "Legendary", baseValue: 150, baseMinWeight: 22, baseMaxWeight: 42, areas: ["Sunken Wilds"] },
  // Gloomspore Valley
  { name: "Boxfish", rarity: "Common", baseValue: 32, baseMinWeight: 8, baseMaxWeight: 18, areas: ["Gloomspore Valley"] },
  { name: "Stingray", rarity: "Common", baseValue: 35, baseMinWeight: 12, baseMaxWeight: 24, areas: ["Gloomspore Valley"] },
  { name: "Squid", rarity: "Uncommon", baseValue: 65, baseMinWeight: 10, baseMaxWeight: 16, areas: ["Gloomspore Valley"] },
  { name: "Atlantic Octopus", rarity: "Uncommon", baseValue: 60, baseMinWeight: 30, baseMaxWeight: 45, areas: ["Gloomspore Valley"] },
  { name: "Catfish", rarity: "Uncommon", baseValue: 32, baseMinWeight: 30, baseMaxWeight: 45, areas: ["Gloomspore Valley"] },
  { name: "Largemouth Bass", rarity: "Rare", baseValue: 65, baseMinWeight: 25, baseMaxWeight: 35, areas: ["Gloomspore Valley"] },
  { name: "Sockeye Salmon", rarity: "Rare", baseValue: 100, baseMinWeight: 20, baseMaxWeight: 30, areas: ["Gloomspore Valley"] },
  { name: "Surubim", rarity: "Rare", baseValue: 68, baseMinWeight: 40, baseMaxWeight: 55, areas: ["Gloomspore Valley"] },
  { name: "Manta Ray", rarity: "Epic", baseValue: 48, baseMinWeight: 70, baseMaxWeight: 100, areas: ["Gloomspore Valley"] },
  { name: "Basking Shark", rarity: "Epic", baseValue: 85, baseMinWeight: 120, baseMaxWeight: 140, areas: ["Gloomspore Valley"] },
  { name: "Phantom Jelly", rarity: "Epic", baseValue: 145, baseMinWeight: 35, baseMaxWeight: 55, areas: ["Gloomspore Valley"] },
  { name: "Alien", rarity: "Epic", baseValue: 140, baseMinWeight: 50, baseMaxWeight: 70, areas: ["Gloomspore Valley"] },
  { name: "Thresher Shark", rarity: "Epic", baseValue: 82, baseMinWeight: 60, baseMaxWeight: 90, areas: ["Gloomspore Valley"] },
  { name: "Angel", rarity: "Mythical", baseValue: 300, baseMinWeight: 80, baseMaxWeight: 100, areas: ["Gloomspore Valley"] },
  // Mini-boss fish (not pondable, no roe) — drop type (Meat/Head) handled in UI
  // baseMinWeight/baseMaxWeight are full fish weights; divide by 3 for per-piece weight
  { name: "Whale", rarity: "Legendary", baseValue: 40, baseMinWeight: 120, baseMaxWeight: 220, areas: ["Spirit Roots"], pondable: false },
  { name: "Dragonfish", rarity: "Mythical", baseValue: 70, baseMinWeight: 150, baseMaxWeight: 250, areas: ["Spirit Roots"], pondable: false },
  { name: "King Anglerfish", rarity: "Mythical", baseValue: 45, baseMinWeight: 150, baseMaxWeight: 250, areas: ["Angler Cave"], pondable: false },
  { name: "Mosasaurus", rarity: "Legendary", baseValue: 50, baseMinWeight: 150, baseMaxWeight: 240, areas: ["Sunken Wilds"], pondable: false },
  { name: "Pelican Eel", rarity: "Mythical", baseValue: 75, baseMinWeight: 175, baseMaxWeight: 285, areas: ["Sunken Wilds"], pondable: false },
  { name: "Orca", rarity: "Legendary", baseValue: 63, baseMinWeight: 200, baseMaxWeight: 280, areas: ["Gloomspore Valley"], pondable: false },
  { name: "Sea Angel", rarity: "Legendary", baseValue: 75, baseMinWeight: 260, baseMaxWeight: 320, areas: ["Gloomspore Valley"], pondable: false },
];

export const MUTATIONS: Mutation[] = [
  { name: "None", multiplier: 1.0, sizeMultiplier: 1.0 },
  { name: "Poop", multiplier: 0.333, sizeMultiplier: 1.333 },
  { name: "Rock", multiplier: 1.0, sizeMultiplier: 1.2, area: "Forgotten Deep" },
  { name: "Moss", multiplier: 1.1, sizeMultiplier: 1.0, area: "Forgotten Deep" },
  { name: "Coral", multiplier: 1.1, sizeMultiplier: 0.8 },
  { name: "Metal", multiplier: 1.2, sizeMultiplier: 1.2 },
  { name: "Sand", multiplier: 1.25, sizeMultiplier: 1.0, area: "Ancient Sands" },
  { name: "Albino", multiplier: 1.3, sizeMultiplier: 1.0 },
  { name: "Transparent", multiplier: 1.35, sizeMultiplier: 1.0 },
  { name: "Cactus", multiplier: 1.45, sizeMultiplier: 1.3, area: "Ancient Sands" },
  { name: "Banana", multiplier: 1.5, sizeMultiplier: 1.1, area: "Sunken Wilds" },
  { name: "Spirit", multiplier: 1.7, sizeMultiplier: 1.2, area: "Spirit Roots" },
  { name: "Fossil", multiplier: 1.75, sizeMultiplier: 0.9, area: "Ancient Sands" },
  { name: "Golden", multiplier: 2.0, sizeMultiplier: 1.2 },
  { name: "Negative", multiplier: 2.0, sizeMultiplier: 1.0 },
  { name: "Fairy", multiplier: 2.3, sizeMultiplier: 1.2, area: "Spirit Roots" },
  { name: "Invisible", multiplier: 2.4, sizeMultiplier: 1.4 },
  { name: "Liquid", multiplier: 2.5, sizeMultiplier: 1.3 },
  { name: "Grounded", multiplier: 2.8, sizeMultiplier: 1.2, area: "Sunken Wilds" },
  { name: "Neon", multiplier: 2.8, sizeMultiplier: 1.2 },
  { name: "Ultraviolet", multiplier: 3.6, sizeMultiplier: 1.3 },
  { name: "Rooted", multiplier: 3.6, sizeMultiplier: 1.2, area: "Spirit Roots" },
  { name: "Toxic", multiplier: 3.75, sizeMultiplier: 1.2 },
  { name: "Jade", multiplier: 4, sizeMultiplier: 1.0, area: "Sunken Wilds" },
  { name: "Spore", multiplier: 2.0, sizeMultiplier: 1.2, area: "Gloomspore Valley" },
  { name: "Amber", multiplier: 2.8, sizeMultiplier: 0.8, area: "Gloomspore Valley" },
  { name: "Crystal", multiplier: 4.2, sizeMultiplier: 1.2, area: "Gloomspore Valley" },
  { name: "Gloomy", multiplier: 6.8, sizeMultiplier: 1.3, area: "Gloomspore Valley" },
  { name: "Cupid", multiplier: 1.4, sizeMultiplier: 1.0 },
  { name: "Lonely", multiplier: 2.0, sizeMultiplier: 1.0 },
  { name: "Shadow", multiplier: 6.66, sizeMultiplier: 1.11 },
  { name: "Angelic", multiplier: 7.77, sizeMultiplier: 1.4 },
  { name: "Abyssal", multiplier: 8.5, sizeMultiplier: 1.4 },
];

export const STAR_LEVELS: StarLevel[] = [
  { label: "Dead", value: 0, multiplier: 0.2 },
  { label: "1 Star", value: 1, multiplier: 0.5 },
  { label: "2 Stars", value: 2, multiplier: 0.75 },
  { label: "3 Stars", value: 3, multiplier: 1.0 },
];

// Cycle times per rarity (seconds)
export const CYCLE_TIMES: Record<string, number> = {
  Common: 60,
  Uncommon: 120,
  Rare: 240,
  Epic: 420,
  Legendary: 600,
  Mythical: 900,
};

// Available pond sizes
export const POND_SIZES = [6, 8, 10, 12, 14, 16, 18];

// Roe Storage capacity per upgrade level (kg)
export const ROE_STORAGE_LEVELS = [
  { level: 0, capacity: 500 },
  { level: 1, capacity: 800 },
  { level: 2, capacity: 1500 },
  { level: 3, capacity: 2000 },
  { level: 4, capacity: 2750 },
  { level: 5, capacity: 3500 },
  { level: 6, capacity: 5500 },
];

// Decoration / Roe Speed bonus per upgrade level
export const DECORATION_LEVELS = [
  { level: 0, speedBonus: 0 },
  { level: 1, speedBonus: 0.05 },
  { level: 2, speedBonus: 0.10 },
  { level: 3, speedBonus: 0.15 },
  { level: 4, speedBonus: 0.20 },
  { level: 5, speedBonus: 0.25 },
  { level: 6, speedBonus: 0.30 },
];

// Fish Feed types with roe speed bonus and duration
export const FISH_FEED = [
  { name: "None", speedBonus: 0, durationMinutes: 0, color: undefined },
  { name: "Algae Feed", speedBonus: 0.05, durationMinutes: 15, color: "rgb(114, 126, 154)" },   // Common
  { name: "Fish Feed", speedBonus: 0.10, durationMinutes: 20, color: "rgb(114, 126, 154)" },    // Common
  { name: "Worm Feed", speedBonus: 0.15, durationMinutes: 30, color: "rgb(135, 203, 116)" },    // Uncommon
  { name: "Shrimp Feed", speedBonus: 0.20, durationMinutes: 45, color: "rgb(89, 191, 255)" },   // Rare
  { name: "Octapus Feed", speedBonus: 0.30, durationMinutes: 60, color: "rgb(147, 123, 226)" }, // Epic
  { name: "Star Feed", speedBonus: 0.40, durationMinutes: 120, color: "rgb(241, 174, 65)" },    // Legendary
];

// Races with cash bonus (applied at roe production time)
export const RACES = [
  { name: "None", cashBonus: 0, color: undefined },
  { name: "Spirit", cashBonus: 0.08, color: "rgb(89, 191, 255)" },      // Rare
  { name: "Anglerfish", cashBonus: 0.08, color: "rgb(147, 123, 226)" }, // Epic
  { name: "Shark", cashBonus: 0.10, color: "rgb(241, 174, 65)" },       // Legendary
  { name: "Kraken", cashBonus: 0.15, color: "rgb(183, 59, 59)" },       // Mythical
  { name: "Sea Angel", cashBonus: 0.15, color: "rgb(183, 59, 59)" },    // Mythical
];

// Artifacts with cash bonus (applied at roe production time)
export const ARTIFACTS = [
  { name: "None", cashBonus: 0, unique: false, color: undefined },
  { name: "The King's Fortune", cashBonus: 0.10, unique: true, color: "rgb(129, 184, 164)" },  // Secret
  { name: "Coin Tier I", cashBonus: 0.0125, unique: false, color: "rgb(155, 94, 166)" },
  { name: "Coin Tier II", cashBonus: 0.01275, unique: false, color: "rgb(87, 115, 179)" },
  { name: "Coin Tier III", cashBonus: 0.013, unique: false, color: "rgb(51, 148, 213)" },
  { name: "Coin Tier IV", cashBonus: 0.01325, unique: false, color: "rgb(41, 177, 99)" },
  { name: "Coin Tier V", cashBonus: 0.0135, unique: false, color: "rgb(235, 191, 16)" },
  { name: "Coin Tier VI", cashBonus: 0.01375, unique: false, color: "rgb(224, 123, 34)" },
  { name: "Coin Tier VII", cashBonus: 0.014, unique: false, color: "rgb(225, 75, 59)" },
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
  Mythical: "rgb(183, 59, 59)",
  Secret: "rgb(129, 184, 164)",
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
  Spore: "rgb(204, 178, 125)",
  Amber: "rgb(115, 62, 49)",
  Crystal: "rgb(169, 152, 196)",
  Gloomy: "rgb(113, 73, 211)",
  Cupid: "rgb(255, 105, 180)",
  Lonely: "rgb(106, 76, 199)",
  Shadow: "rgb(38, 38, 38)",
  Angelic: "rgb(255, 242, 175)",
  Abyssal: "rgb(92, 96, 221)",
};

export const STAR_COLOR = "#FDC85D";

export function getRarityColor(fishName: string): string | undefined {
  const baseName = fishName.replace(/ \((Meat|Head)\)$/, "");
  const fish = FISH_SPECIES.find((f) => f.name === baseName);
  return fish ? RARITY_COLORS[fish.rarity] : undefined;
}

const WEIGHT_COLORS = {
  tiny:   "rgb(210, 210, 210)",
  small:  "rgb(170, 170, 170)",
  normal: "rgb(150, 150, 150)",
  big:    "rgb(255, 205, 89)",
  giant:  "rgb(255, 80, 80)",
};

function lerpWeightColor(a: string, b: string, t: number): string {
  const pa = a.match(/\d+/g)!.map(Number);
  const pb = b.match(/\d+/g)!.map(Number);
  const r = Math.round(pa[0] + (pb[0] - pa[0]) * t);
  const g = Math.round(pa[1] + (pb[1] - pa[1]) * t);
  const bv = Math.round(pa[2] + (pb[2] - pa[2]) * t);
  return `rgb(${r}, ${g}, ${bv})`;
}

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

export function getWeightColor(weight: number, fishName: string, mutation?: string): string {
  const baseName = fishName.replace(/ \((Meat|Head)\)$/, "");
  const fish = FISH_SPECIES.find((f) => f.name === baseName);
  if (!fish) return WEIGHT_COLORS.normal;
  const range = fish.baseMaxWeight - fish.baseMinWeight;
  if (range === 0) return WEIGHT_COLORS.normal;
  const sizeMult = mutation
    ? (MUTATIONS.find((m) => m.name === mutation)?.sizeMultiplier ?? 1)
    : 1;
  const v12 = Math.min(1.2, Math.max(0, (weight / sizeMult - fish.baseMinWeight) / range));
  if (v12 <= 0.05) {
    return WEIGHT_COLORS.tiny;
  } else if (v12 <= 0.3) {
    return lerpWeightColor(WEIGHT_COLORS.tiny, WEIGHT_COLORS.small, Math.min(1, (v12 - 0.05) / 0.25));
  } else if (v12 <= 0.7) {
    return lerpWeightColor(WEIGHT_COLORS.small, WEIGHT_COLORS.normal, Math.min(1, (v12 - 0.3) / 0.4));
  } else if (v12 <= 1.0) {
    return lerpWeightColor(WEIGHT_COLORS.normal, WEIGHT_COLORS.big, Math.min(1, (v12 - 0.7) / 0.3));
  } else {
    return lerpWeightColor(WEIGHT_COLORS.big, WEIGHT_COLORS.giant, Math.min(1, (v12 - 1.0) / 0.2));
  }
}

