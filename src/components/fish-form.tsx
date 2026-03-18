"use client";

import * as React from "react";
import {
  FISH_SPECIES,
  MUTATIONS,
  STAR_LEVELS,
  getAvailableMutations,
  RARITY_COLORS,
  MUTATION_COLORS,
  STAR_COLOR,
  getWeightColor,
  CYCLE_TIMES,
  RACES,
  ARTIFACTS,
} from "@/lib/fish-config";
import {
  calculateValue,
  calculateOptimization,
  validateWeight,
  calculateBaseRoePerHour,
  calculateBoostedRoePerHour,
} from "@/lib/fish-utils";
import { type GlobalSettings } from "@/lib/types";
import { recordCalculation } from "@/lib/stat-tracker";
import { Combobox } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface FishFormData {
  fishName: string;
  weight: number;
  stars: number;
  mutation: string;
  value: number;
  optimization: number;
}

interface FishFormProps {
  renderActions: (
    formData: FishFormData | null,
    reset: () => void
  ) => React.ReactNode;
  initialData?: {
    fishName?: string;
    weight?: number;
    stars?: number;
    mutation?: string;
  };
  settings?: {
    race: string;
    artifact1: string;
    artifact2: string;
    artifact3: string;
    roeStorageLevel: number;
    decorationLevel: number;
  };
}

const AREA_ORDER = [
  "Gloomspore Valley",
  "Sunken Wilds",
  "Angler Cave",
  "Spirit Roots",
  "Ancient Sands",
  "Ocean",
  "Forgotten Deep",
] as const;

const RARITY_RANK: Record<string, number> = {
  Secret: 0,
  Mythical: 1,
  Legendary: 2,
  Epic: 3,
  Rare: 4,
  Uncommon: 5,
  Common: 6,
};

// Automatically derive areas from FISH_SPECIES to ensure new areas are never missed
const displayAreas = Array.from(
  new Set(FISH_SPECIES.flatMap((f) => f.areas))
).sort((a, b) => {
  const indexA = AREA_ORDER.indexOf(a as any);
  const indexB = AREA_ORDER.indexOf(b as any);
  if (indexA === -1 && indexB === -1) return a.localeCompare(b);
  if (indexA === -1) return 1; // Put unknowns at bottom
  if (indexB === -1) return -1;
  return indexA - indexB;
});

const fishOptions = displayAreas.flatMap((area) =>
  FISH_SPECIES.filter((f) => f.areas.includes(area))
    .sort((a, b) => RARITY_RANK[a.rarity] - RARITY_RANK[b.rarity])
    .map((f) => ({
      value: f.name,
      label: f.name,
      description: f.rarity,
      color: RARITY_COLORS[f.rarity],
      group: area,
    }))
);

export function FishForm({ renderActions, initialData, settings }: FishFormProps) {
  const [fishName, setFishName] = React.useState(initialData?.fishName ?? "");
  const [weightStr, setWeightStr] = React.useState(
    initialData?.weight?.toString() ?? ""
  );
  const [stars, setStars] = React.useState(
    initialData?.stars !== undefined ? initialData.stars.toString() : ""
  );
  const [mutation, setMutation] = React.useState(
    initialData?.mutation ?? "None"
  );
  const [activeDropdown, setActiveDropdown] = React.useState<string | null>(
    null
  );

  const selectedFish = FISH_SPECIES.find((f) => f.name === fishName);

  const availableMutations = React.useMemo(
    () => (selectedFish ? getAvailableMutations(selectedFish) : MUTATIONS),
    [selectedFish]
  );

  const mutationOptions = React.useMemo(
    () =>
      [...availableMutations]
        .sort((a, b) => b.multiplier - a.multiplier)
        .map((m) => ({
          value: m.name,
          label: m.name,
          description: `${m.multiplier}x`,
          color: MUTATION_COLORS[m.name],
        })),
    [availableMutations]
  );

  // Reset mutation to "None" if current selection is no longer valid for this fish
  React.useEffect(() => {
    if (
      mutation !== "None" &&
      !availableMutations.some((m) => m.name === mutation)
    ) {
      setMutation("None");
    }
  }, [availableMutations, mutation]);
  const weight = parseFloat(weightStr);
  const selectedStar = STAR_LEVELS.find((s) => s.value.toString() === stars);
  const selectedMutation = MUTATIONS.find((m) => m.name === mutation);

  const sizeMult = selectedMutation?.sizeMultiplier ?? 1;
  const weightValidation =
    selectedFish && weightStr
      ? validateWeight(
        weight,
        Math.round(selectedFish.minWeight * sizeMult * 10) / 10,
        Math.round(selectedFish.maxWeight * sizeMult * 10) / 10
      )
      : null;

  const formData = React.useMemo<FishFormData | null>(() => {
    if (
      !selectedFish ||
      !selectedStar ||
      !selectedMutation ||
      !weightValidation?.valid
    ) {
      return null;
    }
    const value = calculateValue(
      weight,
      selectedFish.baseValue,
      selectedStar.multiplier,
      selectedMutation.multiplier,
      selectedMutation.sizeMultiplier
    );
    const optimization = calculateOptimization(value, selectedFish);
    return {
      fishName,
      weight,
      stars: selectedStar.value,
      mutation,
      value,
      optimization,
    };
  }, [
    fishName,
    weight,
    stars,
    mutation,
    selectedFish,
    selectedStar,
    selectedMutation,
    weightValidation,
  ]);

  // Track calculations optimistically
  React.useEffect(() => {
    if (formData) {
      recordCalculation();
    }
  }, [
    formData?.fishName,
    formData?.weight,
    formData?.stars,
    formData?.mutation,
  ]);

  const reset = React.useCallback(() => {
    setFishName("");
    setWeightStr("");
    setStars("");
    setMutation("None");
  }, []);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Fish</Label>
        <Combobox
          options={fishOptions}
          value={fishName}
          onChange={setFishName}
          placeholder="Select fish..."
          searchPlaceholder="Search fish..."
          open={activeDropdown === "fish"}
          onOpenChange={(o) => setActiveDropdown(o ? "fish" : null)}
        />
      </div>

      <div className="space-y-2">
        <Label>Weight (kg)</Label>
        <Input
          type="number"
          step="0.01"
          placeholder={
            selectedFish
              ? `${Math.round(selectedFish.minWeight * sizeMult * 10) / 10} - ${Math.round(selectedFish.maxWeight * sizeMult * 10) / 10}`
              : "Select a fish first"
          }
          value={weightStr}
          onChange={(e) => setWeightStr(e.target.value)}
          disabled={!selectedFish}
          className={
            weightValidation && !weightValidation.valid
              ? "border-destructive"
              : ""
          }
          style={
            selectedFish && weightValidation?.valid
              ? { color: getWeightColor(weight, fishName) }
              : undefined
          }
        />
        {weightValidation && !weightValidation.valid && selectedFish && (
          <p className="text-sm text-destructive">
            {selectedFish.name} weight must be between {Math.round(selectedFish.minWeight * sizeMult * 10) / 10}kg
            - {Math.round(selectedFish.maxWeight * sizeMult * 10) / 10}kg
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Stars</Label>
        <Select
          value={stars}
          onValueChange={setStars}
          open={activeDropdown === "stars"}
          onOpenChange={(o) => setActiveDropdown(o ? "stars" : null)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select stars..." />
          </SelectTrigger>
          <SelectContent>
            {[...STAR_LEVELS].reverse().map((s) => (
              <SelectItem key={s.value} value={s.value.toString()}>
                <span style={s.value > 0 ? { color: STAR_COLOR } : undefined}>
                  {s.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Mutation</Label>
        <Combobox
          options={mutationOptions}
          value={mutation}
          onChange={setMutation}
          placeholder="Select mutation..."
          searchPlaceholder="Search mutations..."
          open={activeDropdown === "mutation"}
          onOpenChange={(o) => setActiveDropdown(o ? "mutation" : null)}
        />
      </div>

      {formData && (() => {
        const fish = FISH_SPECIES.find((f) => f.name === formData.fishName);
        const hasMutation = formData.mutation !== "None";
        const rarity = fish?.rarity ?? "Common";
        const baseRoe = calculateBaseRoePerHour(formData.value, hasMutation, rarity);

        const hasActiveBoosts = settings && (
          settings.race !== "None" ||
          settings.artifact1 !== "None" ||
          settings.artifact2 !== "None" ||
          settings.artifact3 !== "None"
        );

        const globalSettings: GlobalSettings = settings
          ? { race: settings.race, artifact1: settings.artifact1, artifact2: settings.artifact2, artifact3: settings.artifact3 }
          : { race: "None", artifact1: "None", artifact2: "None", artifact3: "None" };

        const boostedRoe = settings
          ? calculateBoostedRoePerHour(baseRoe, globalSettings, 0, 0, false)
          : baseRoe;

        // Boosted sell price (race + artifacts affect fish sell value too)
        const artBonusRaw =
          (ARTIFACTS.find((a) => a.name === globalSettings.artifact1)?.cashBonus ?? 0) +
          (ARTIFACTS.find((a) => a.name === globalSettings.artifact2)?.cashBonus ?? 0) +
          (ARTIFACTS.find((a) => a.name === globalSettings.artifact3)?.cashBonus ?? 0);
        const cashMultiplier =
          (1 + (RACES.find((r) => r.name === globalSettings.race)?.cashBonus ?? 0)) *
          (1 + artBonusRaw);
        const boostedValue = Math.round(formData.value * cashMultiplier);

        const boostPct = hasActiveBoosts
          ? `+${Number(((cashMultiplier - 1) * 100).toFixed(4))}%`
          : null;

        return (
          <div className="rounded-md border bg-secondary/50 p-4 space-y-3">
            <div className={hasActiveBoosts ? "grid gap-3" : ""} style={hasActiveBoosts ? { gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" } : undefined}>
              {/* Base */}
              <div>
                <div className="text-[11px] font-semibold text-foreground uppercase tracking-widest mb-2 pb-1 border-b border-foreground/20">
                  Base
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm gap-2">
                    <span className="text-muted-foreground">Sell Price</span>
                    <span className="font-semibold">${formData.value.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm gap-2">
                    <span className="text-muted-foreground">Roe $/hr</span>
                    <span className="font-semibold">${baseRoe.toLocaleString()}/hr</span>
                  </div>
                </div>
              </div>

              {/* Boosted */}
              {hasActiveBoosts && (
                <div>
                  <div className="text-[11px] font-semibold text-amber-400/70 uppercase tracking-widest mb-2 pb-1 border-b border-amber-500/20">
                    Boosted <span className="text-amber-400/50">({boostPct})</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm gap-2">
                      <span className="text-muted-foreground">Sell Price</span>
                      <span className="font-semibold text-amber-400">${boostedValue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm gap-2">
                      <span className="text-muted-foreground">Roe $/hr</span>
                      <span className="font-semibold text-amber-400">${boostedRoe.toLocaleString()}/hr</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        );
      })()}

      <div className="flex gap-2 pt-2">{renderActions(formData, reset)}</div>
    </div>
  );
}
