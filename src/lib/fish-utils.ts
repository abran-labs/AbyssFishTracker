import { FishSpecies } from "./types";
import { MUTATIONS, STAR_LEVELS } from "./fish-config";

export function calculateValue(
  weight: number,
  baseValue: number,
  starMultiplier: number,
  mutationMultiplier: number
): number {
  return Math.round(weight * baseValue * starMultiplier * mutationMultiplier);
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
