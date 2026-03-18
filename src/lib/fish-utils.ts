import { FishSpecies, GlobalSettings } from "./types";
import { MUTATIONS, STAR_LEVELS, CYCLE_TIMES, ARTIFACTS, RACES, DECORATION_LEVELS } from "./fish-config";

export function calculateValue(
  weight: number,
  baseValue: number,
  starMultiplier: number,
  mutationMultiplier: number,
  sizeMultiplier: number = 1
): number {
  const baseWeight = Math.round((weight / sizeMultiplier) * 10) / 10;
  const correctedWeight = baseWeight * sizeMultiplier;
  return Math.round(correctedWeight * baseValue * starMultiplier * mutationMultiplier);
}

export function calculateOptimization(
  actualValue: number,
  fish: FishSpecies
): number {
  const highestMutationMultiplier = Math.max(
    ...MUTATIONS.map((m) => m.multiplier)
  );
  const threeStarMultiplier =
    STAR_LEVELS.find((s) => s.value === 3)?.multiplier ?? 1.0;
  const theoreticalMax =
    fish.maxWeight * fish.baseValue * threeStarMultiplier * highestMutationMultiplier;
  if (theoreticalMax === 0) return 0;
  return (actualValue / theoreticalMax) * 100;
}

export function validateWeight(
  weight: number,
  minWeight: number,
  maxWeight: number
): { valid: boolean; error?: string } {
  if (isNaN(weight) || weight <= 0) {
    return { valid: false, error: "Weight must be a positive number" };
  }
  if (weight < minWeight || weight > maxWeight) {
    return {
      valid: false,
      error: `Weight must be between ${minWeight}kg - ${maxWeight}kg`,
    };
  }
  return { valid: true };
}

/**
 * Calculate base roe $/hr using the confirmed game formula:
 * mutationFactor = hasMutation ? 0.5 : 1.0
 * roePerHour = ceil(fishValue * 0.02 * mutationFactor) * (3600 / cycleTime)
 */
export function calculateBaseRoePerHour(
  fishValue: number,
  hasMutation: boolean,
  rarity: string
): number {
  const cycleTime = CYCLE_TIMES[rarity] ?? 600;
  const mutationFactor = hasMutation ? 0.5 : 1.0;
  return Math.ceil(fishValue * 0.02 * mutationFactor) * (3600 / cycleTime);
}

/**
 * Calculate boosted roe $/hr with race/artifact cash multipliers
 * and decoration/feed speed multipliers.
 * Race & artifact bonuses affect roe value at production time.
 * Decoration & feed affect cycle speed.
 */
export function calculateBoostedRoePerHour(
  baseRoePerHour: number,
  globalSettings: GlobalSettings,
  decorationLevel: number,
  feedSpeedBonus: number,
  isOffline: boolean
): number {
  // Cash multiplier from race + artifacts (production-time bonuses)
  const race = RACES.find((r) => r.name === globalSettings.race);
  const art1 = ARTIFACTS.find((a) => a.name === globalSettings.artifact1);
  const art2 = ARTIFACTS.find((a) => a.name === globalSettings.artifact2);
  const art3 = ARTIFACTS.find((a) => a.name === globalSettings.artifact3);
  const cashMultiplier =
    1 +
    (race?.cashBonus ?? 0) +
    (art1?.cashBonus ?? 0) +
    (art2?.cashBonus ?? 0) +
    (art3?.cashBonus ?? 0);

  // Speed multiplier from decoration + feed
  const decoBonus = DECORATION_LEVELS[decorationLevel]?.speedBonus ?? 0;
  const speedMultiplier = 1 + decoBonus + feedSpeedBonus;

  const offlineMultiplier = isOffline ? 0.5 : 1.0;

  return baseRoePerHour * cashMultiplier * speedMultiplier * offlineMultiplier;
}
