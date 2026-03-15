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
} from "@/lib/fish-config";
import {
  calculateValue,
  calculateOptimization,
  validateWeight,
} from "@/lib/fish-utils";
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
}

const AREA_ORDER = ["Sunken Wilds", "Angler Cave", "Spirit Roots", "Ancient Sands", "Ocean", "Forgotten Deep"] as const;

const RARITY_RANK: Record<string, number> = { Legendary: 0, Epic: 1, Rare: 2, Uncommon: 3, Common: 4 };

const fishOptions = AREA_ORDER.flatMap((area) =>
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

export function FishForm({ renderActions, initialData }: FishFormProps) {
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

  const weightValidation =
    selectedFish && weightStr
      ? validateWeight(weight, selectedFish.minWeight, selectedFish.maxWeight)
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
      selectedMutation.multiplier
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
              ? `${selectedFish.minWeight} - ${selectedFish.maxWeight}`
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
            {selectedFish.name} weight must be between {selectedFish.minWeight}kg
            - {selectedFish.maxWeight}kg
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

      {formData && (
        <div className="rounded-md border bg-secondary/50 p-4 space-y-1">
          <div className="flex justify-between text-sm">
            <span>
              <span className="text-muted-foreground">Value</span>
              <span className="text-xs text-yellow-500 italic"> — base only, no race/artifact bonuses</span>
            </span>
            <span className="font-semibold">
              ${formData.value.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span>
              <span className="text-muted-foreground">Optimization</span>
              <span className="text-xs text-yellow-500 italic"> — % of max possible value for this fish</span>
            </span>
            <span className="font-semibold">
              {formData.optimization.toFixed(1)}%
            </span>
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-2">{renderActions(formData, reset)}</div>
    </div>
  );
}
