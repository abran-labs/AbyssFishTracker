
"use client";

import * as React from "react";
import { type FishEntry } from "@/lib/types";
import { type PondSnapshotData } from "@/lib/fish-actions";
import {
  FISH_SPECIES,
  getRarityColor,
  MUTATION_COLORS,
  STAR_COLOR,
  getWeightColor,
  getValueColor,
  getRankColor,
  ROE_STORAGE_LEVELS,
  DECORATION_LEVELS,
  RACES,
  ARTIFACTS,
  POND_SIZES,
  CYCLE_TIMES,
} from "@/lib/fish-config";
import { calculateBaseRoePerHour, calculateBoostedRoePerHour, computeEntryValue, computeIdealPond } from "@/lib/fish-utils";
import { useSettings } from "@/components/settings-context";
import { PondPrediction } from "@/components/pond-prediction";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import {
  IconArrowRight,
  IconChevronLeft,
  IconChevronRight,
  IconCopy,
  IconCheck,
  IconEdit,
  IconTrash,
  IconPlus,
  IconPencil,
} from "@tabler/icons-react";
import { useToast } from "@/components/ui/toast-context";
import { FishPickerModal } from "@/components/fish-picker-modal";
import { FishForm, type FishFormData } from "@/components/fish-form";
import { ImagePasteZone } from "@/components/image-paste-zone";
import { type OcrResult } from "@/lib/ocr";

const LOADOUT_NAMES: Record<number, string> = {
  0: "ROE $/hr Optimized",
  1: "Balanced $/hr + kg/hr",
};

function getLoadoutName(index: number, snapshot?: PondSnapshotData | null): string {
  if (index <= 1) return LOADOUT_NAMES[index];
  return snapshot?.loadoutName || `Custom Loadout ${index - 1}`;
}

interface SwapEntry {
  remove?: FishEntry;
  add?: FishEntry;
}

function formatTimeAgo(isoString: string): string {
  const seconds = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function computeSwaps(
  idealPondFish: FishEntry[],
  snapshot: PondSnapshotData,
  allEntries: FishEntry[]
): SwapEntry[] {
  const idealIds = new Set(idealPondFish.map((f) => f.id));
  const snapshotIds = new Set(snapshot.fishIds);

  const toAdd = idealPondFish.filter((f) => !snapshotIds.has(f.id));

  const toRemove: FishEntry[] = [];
  for (const id of snapshot.fishIds) {
    if (idealIds.has(id)) continue;
    const found = allEntries.find((f) => f.id === id);
    if (found) toRemove.push(found);
  }

  toRemove.sort((a, b) => computeEntryValue(a) - computeEntryValue(b));
  toAdd.sort((a, b) => computeEntryValue(b) - computeEntryValue(a));

  const swaps: SwapEntry[] = [];
  const maxPairs = Math.max(toRemove.length, toAdd.length);
  for (let i = 0; i < maxPairs; i++) {
    swaps.push({ remove: toRemove[i], add: toAdd[i] });
  }
  return swaps;
}

const DISCORD_SEP = "> ---------------------------------------->";

function buildEntryDiscordText(entry: FishEntry, baseValue: number, baseRoe: number | null): string {
  const displayName = entry.fishName.replace(/ \((Head|Meat)\)$/, (_, dt) => ` ${dt}`);
  const starLabel = entry.stars === 0 ? "Dead" : `${entry.stars} Star`;
  const lines = [
    `**${displayName}**`,
    `**\`${entry.weight.toLocaleString()} kg\`** | **\`${starLabel}\`** | **\`${entry.mutation}\`**`,
    DISCORD_SEP,
    `> :moneybag: Base Sell: \`$${baseValue.toLocaleString()}\``,
  ];
  if (baseRoe !== null && baseRoe > 0) {
    lines.push(`> :fish: Base Roe $/hour: \`$${baseRoe.toLocaleString()}\``);
  }
  lines.push(DISCORD_SEP);
  return lines.join("\n");
}

interface FishPondTabProps {
  entries: FishEntry[];
  pondSnapshots: PondSnapshotData[];
  activeLoadoutIndex: number;
  onLoadoutChange: (index: number) => void;
  onUpdateSnapshot: (loadoutIndex: number, fishIds: string[], pondSize: number) => Promise<void>;
  onPondSizeChange: (size: number) => Promise<void>;
  onRenameLoadout: (loadoutIndex: number, name: string) => Promise<void>;
  onRemoveFromPond: (loadoutIndex: number, fishId: string) => Promise<void>;
  onMoveBetweenPonds: (fishId: string, fromIndex: number, toIndex: number) => Promise<void>;
  onAdd: (data: Omit<FishEntry, "id" | "createdAt" | "updatedAt">, loadoutIndex: number) => Promise<FishEntry>;
  onUpdate: (id: string, data: Omit<FishEntry, "id" | "createdAt" | "updatedAt">) => Promise<FishEntry>;
  onDeleteEntry: (id: string) => Promise<void>;
  onRestore: (entry: FishEntry) => Promise<void>;
}

export function FishPondTab({
  entries,
  pondSnapshots,
  activeLoadoutIndex,
  onLoadoutChange,
  onUpdateSnapshot,
  onPondSizeChange,
  onRenameLoadout,
  onRemoveFromPond,
  onMoveBetweenPonds,
  onAdd,
  onUpdate,
  onDeleteEntry,
  onRestore,
}: FishPondTabProps) {
  const settings = useSettings();
  const { addToast, removeToast } = useToast();
  const [autoSavedLoadouts, setAutoSavedLoadouts] = React.useState<Set<number>>(new Set());
  const activeSnapshot = pondSnapshots.find((s) => s.loadoutIndex === activeLoadoutIndex) ?? null;
  const [pondSize, setPondSize] = React.useState(activeSnapshot?.pondSize ?? pondSnapshots[0]?.pondSize ?? 6);
  const [swapsDismissed, setSwapsDismissed] = React.useState(false);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [editingEntry, setEditingEntry] = React.useState<FishEntry | null>(null);
  const [editModalOpen, setEditModalOpen] = React.useState(false);
  const [formKey, setFormKey] = React.useState(0);
  const [renamingLoadout, setRenamingLoadout] = React.useState(false);
  const [renameValue, setRenameValue] = React.useState("");
  const [showFishPicker, setShowFishPicker] = React.useState(false);
  const [sendToPondId, setSendToPondId] = React.useState<string | null>(null);
  const [showAddForm, setShowAddForm] = React.useState(false);
  const [addFormKey, setAddFormKey] = React.useState(0);
  const [ocrData, setOcrData] = React.useState<{
    fishName?: string;
    weight?: number;
    stars?: number;
    mutation?: string;
  } | undefined>(undefined);

  const isAutoLoadout = activeLoadoutIndex <= 1;
  const isCustomLoadout = activeLoadoutIndex >= 2;

  React.useEffect(() => {
    const snap = pondSnapshots.find((s) => s.loadoutIndex === activeLoadoutIndex);
    const size = snap?.pondSize ?? pondSnapshots[0]?.pondSize;
    if (size && size !== pondSize) {
      setPondSize(size);
    }
  }, [activeLoadoutIndex, pondSnapshots]);

  // Compute ideal pond for the active auto-optimized loadout
  const idealPond = React.useMemo(() => {
    if (!isAutoLoadout) return [];
    const mode = activeLoadoutIndex === 0 ? "roe" as const : "balanced" as const;
    return computeIdealPond(entries, pondSize, mode);
  }, [entries, pondSize, activeLoadoutIndex, isAutoLoadout]);

  // All entries sorted by roe $/hr (for ranking)
  const sorted = React.useMemo(() => {
    return [...entries].sort((a, b) => {
      const aFish = FISH_SPECIES.find((f) => f.name === a.fishName);
      const bFish = FISH_SPECIES.find((f) => f.name === b.fishName);
      const aRoe = aFish ? calculateBaseRoePerHour(computeEntryValue(a), a.mutation !== "None", aFish.rarity) : 0;
      const bRoe = bFish ? calculateBaseRoePerHour(computeEntryValue(b), b.mutation !== "None", bFish.rarity) : 0;
      return bRoe - aRoe;
    });
  }, [entries]);

  // The fish actually in the active pond
  const pondFish = React.useMemo(() => {
    if (!activeSnapshot) return [];
    const found: FishEntry[] = [];
    for (const id of activeSnapshot.fishIds) {
      const entry = entries.find((e) => e.id === id);
      if (entry) found.push(entry);
    }
    return found;
  }, [activeSnapshot, entries]);

  // Rank map across all entries
  const rankMap = React.useMemo(() => {
    const map = new Map<string, number>();
    sorted.forEach((e, idx) => map.set(e.id, idx + 1));
    return map;
  }, [sorted]);

  const globalSettings = React.useMemo(() => ({
    race: settings.race,
    artifact1: settings.artifact1,
    artifact2: settings.artifact2,
    artifact3: settings.artifact3,
  }), [settings.race, settings.artifact1, settings.artifact2, settings.artifact3]);

  const { cashBonus, speedBonus } = React.useMemo(() => {
    const r = RACES.find((r) => r.name === settings.race)?.cashBonus ?? 0;
    const a1 = ARTIFACTS.find((a) => a.name === settings.artifact1)?.cashBonus ?? 0;
    const a2 = ARTIFACTS.find((a) => a.name === settings.artifact2)?.cashBonus ?? 0;
    const a3 = ARTIFACTS.find((a) => a.name === settings.artifact3)?.cashBonus ?? 0;
    const cashMultiplier = (1 + (a1 + a2 + a3)) * (1 + r);
    const speed = DECORATION_LEVELS[settings.decorationLevel]?.speedBonus ?? 0;
    return { cashBonus: cashMultiplier - 1, speedBonus: speed };
  }, [settings.race, settings.artifact1, settings.artifact2, settings.artifact3, settings.decorationLevel]);

  const allValues = React.useMemo(() => entries.map((e) => Math.round(computeEntryValue(e) * (cashBonus + 1))), [entries, cashBonus]);

  const valueLabel = cashBonus > 0.00005
    ? `Value (+${Number((cashBonus * 100).toFixed(4))}%)`
    : "Value";

  const roeLabel = (cashBonus + speedBonus) > 0.00005
    ? `Roe $/hr (+${Number(((cashBonus + speedBonus) * 100).toFixed(4))}%)`
    : "Roe $/hr";

  const getDisplayRoe = React.useCallback((entry: FishEntry) => {
    const fish = FISH_SPECIES.find((f) => f.name === entry.fishName);
    if (!fish) return 0;
    const base = calculateBaseRoePerHour(computeEntryValue(entry), entry.mutation !== "None", fish.rarity);
    return Math.round(calculateBoostedRoePerHour(base, globalSettings, settings.decorationLevel, 0, false));
  }, [globalSettings, settings.decorationLevel]);

  const allRoeValues = React.useMemo(() => pondFish.map(getDisplayRoe), [pondFish, getDisplayRoe]);

  // Display pond fish sorted by roe $/hr descending
  const displayPondFish = React.useMemo(
    () => [...pondFish].sort((a, b) => getDisplayRoe(b) - getDisplayRoe(a)),
    [pondFish, getDisplayRoe]
  );

  // Auto-save snapshot on first visit for auto-optimized loadouts
  React.useEffect(() => {
    if (!isAutoLoadout) return;
    if (autoSavedLoadouts.has(activeLoadoutIndex)) return;
    const snap = pondSnapshots.find((s) => s.loadoutIndex === activeLoadoutIndex);
    if (snap === undefined && idealPond.length > 0) {
      setAutoSavedLoadouts((prev) => new Set(prev).add(activeLoadoutIndex));
      if (activeLoadoutIndex === 0 && !settings.pondSortNoticeDismissed) {
        settings.updateSettings({ pondSortNoticeDismissed: true });
      }
      onUpdateSnapshot(activeLoadoutIndex, idealPond.map((f) => f.id), pondSize);
    }
  }, [activeLoadoutIndex, pondSnapshots, idealPond, pondSize, onUpdateSnapshot, autoSavedLoadouts, isAutoLoadout]);

  // Compute pending swaps for current auto-optimized loadout
  const swaps = React.useMemo(() => {
    if (!isAutoLoadout || !activeSnapshot || idealPond.length === 0) return [];
    const all = computeSwaps(idealPond, activeSnapshot, entries);
    const ignored = new Set(settings.ignoredSwapFishIds);
    return all.filter((s) => !s.add || !ignored.has(s.add.id));
  }, [activeSnapshot, idealPond, entries, settings.ignoredSwapFishIds, isAutoLoadout]);

  // Reset dismiss state when snapshot changes
  React.useEffect(() => {
    setSwapsDismissed(false);
  }, [activeSnapshot?.createdAt]);

  const handleUpdatePond = React.useCallback(async () => {
    await onUpdateSnapshot(activeLoadoutIndex, idealPond.map((f) => f.id), pondSize);
  }, [activeLoadoutIndex, idealPond, pondSize, onUpdateSnapshot]);

  const handleCopy = React.useCallback((entry: FishEntry) => {
    const baseValue = computeEntryValue(entry);
    const fish = FISH_SPECIES.find((f) => f.name === entry.fishName.replace(/ \((Meat|Head)\)$/, ""));
    const hasMutation = entry.mutation !== "None";
    const baseRoe = fish && fish.pondable !== false
      ? calculateBaseRoePerHour(baseValue, hasMutation, fish.rarity)
      : null;
    navigator.clipboard.writeText(buildEntryDiscordText(entry, baseValue, baseRoe));
    setCopiedId(entry.id);
    setTimeout(() => setCopiedId(null), 2000);
  }, []);

  const openEdit = (entry: FishEntry) => {
    setEditingEntry(entry);
    setFormKey((k) => k + 1);
    setEditModalOpen(true);
  };

  const handleEditSubmit = async (formData: FishFormData) => {
    if (!editingEntry) return;
    const data = {
      fishName: formData.fishName,
      weight: formData.weight,
      stars: formData.stars,
      mutation: formData.mutation,
    };
    await onUpdate(editingEntry.id, data);
    addToast({ variant: "success", title: "Fish Updated", description: `${formData.fishName} has been updated.` });
    setEditModalOpen(false);
    setEditingEntry(null);
  };

  const handleRemove = React.useCallback(async (entry: FishEntry) => {
    await onRemoveFromPond(activeLoadoutIndex, entry.id);
    addToast({
      variant: "warning",
      title: "Removed from Pond",
      description: `${entry.fishName} removed from ${getLoadoutName(activeLoadoutIndex, activeSnapshot)}.`,
      action: (
        <button
          onClick={async () => {
            // Undo: re-add to the loadout
            const snap = pondSnapshots.find((s) => s.loadoutIndex === activeLoadoutIndex);
            if (snap) {
              await onUpdateSnapshot(activeLoadoutIndex, [...snap.fishIds, entry.id], snap.pondSize);
            }
          }}
          className="text-xs font-semibold underline underline-offset-2 hover:opacity-80"
        >
          Undo
        </button>
      ),
    });
  }, [activeLoadoutIndex, activeSnapshot, onRemoveFromPond, onUpdateSnapshot, pondSnapshots, addToast]);

  const handleMoveToPond = React.useCallback(async (fishId: string, toIndex: number) => {
    if (isAutoLoadout) {
      // Auto-managed ponds: copy (just add to target, don't remove from source)
      const targetSnap = pondSnapshots.find((s) => s.loadoutIndex === toIndex);
      const fishIds = targetSnap ? [...targetSnap.fishIds, fishId] : [fishId];
      await onUpdateSnapshot(toIndex, fishIds, pondSize);
      addToast({
        variant: "success",
        title: "Copied to Pond",
        description: `Fish copied to ${getLoadoutName(toIndex, targetSnap)}.`,
      });
    } else {
      // Custom ponds: move (remove from source, add to target)
      await onMoveBetweenPonds(fishId, activeLoadoutIndex, toIndex);
      const targetSnap = pondSnapshots.find((s) => s.loadoutIndex === toIndex);
      addToast({
        variant: "success",
        title: "Moved to Pond",
        description: `Fish moved to ${getLoadoutName(toIndex, targetSnap)}.`,
      });
    }
    setSendToPondId(null);
  }, [activeLoadoutIndex, isAutoLoadout, onMoveBetweenPonds, onUpdateSnapshot, pondSnapshots, pondSize, addToast]);

  const handleOcrResult = React.useCallback((result: OcrResult) => {
    const baseName = result.fishName ?? undefined;
    const fishName = baseName && result.dropType ? `${baseName} (${result.dropType})` : baseName;
    setOcrData({
      fishName,
      weight: result.weight ?? undefined,
      stars: result.stars ?? undefined,
      mutation: result.mutation ?? undefined,
    });
    setAddFormKey((k) => k + 1);
  }, []);

  const handleAddSubmit = async (formData: FishFormData) => {
    const data = {
      fishName: formData.fishName,
      weight: formData.weight,
      stars: formData.stars,
      mutation: formData.mutation,
    };
    await onAdd(data, activeLoadoutIndex);
    addToast({ variant: "success", title: "Fish Added", description: `${data.fishName} added to log and ${getLoadoutName(activeLoadoutIndex, activeSnapshot)}.` });
    setShowAddForm(false);
    setOcrData(undefined);
  };

  const handleRenameSubmit = async () => {
    if (renameValue.trim()) {
      await onRenameLoadout(activeLoadoutIndex, renameValue.trim());
    }
    setRenamingLoadout(false);
  };

  // Build empty slots for custom loadouts
  const emptySlotCount = isCustomLoadout ? Math.max(0, pondSize - pondFish.length) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <h2 className="text-lg font-semibold shrink-0">Fish Pond</h2>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 ml-auto">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Storage:</span>
            <Select
              value={settings.roeStorageLevel.toString()}
              onValueChange={(val) => settings.updateSettings({ roeStorageLevel: parseInt(val, 10) })}
            >
              <SelectTrigger className="w-[100px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROE_STORAGE_LEVELS.map((lvl) => (
                  <SelectItem key={lvl.level} value={lvl.level.toString()}>
                    {lvl.capacity.toLocaleString()}kg
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Speed:</span>
            <Select
              value={settings.decorationLevel.toString()}
              onValueChange={(val) => settings.updateSettings({ decorationLevel: parseInt(val, 10) })}
            >
              <SelectTrigger className="w-[80px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DECORATION_LEVELS.map((lvl) => (
                  <SelectItem key={lvl.level} value={lvl.level.toString()}>
                    {lvl.speedBonus > 0 ? `+${(lvl.speedBonus * 100).toFixed(0)}%` : "+0%"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Size:</span>
            <Select
              value={pondSize.toString()}
              onValueChange={(val) => {
                const num = parseInt(val, 10);
                setPondSize(num);
                onPondSizeChange(num);
              }}
            >
              <SelectTrigger className="w-24 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {POND_SIZES.map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num} Fish
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Pond Sort Notice */}
      {!settings.pondSortNoticeDismissed && (
        <Card className="border-blue-500/50 bg-blue-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-blue-400">
              Dynamic Value Update!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              Fish log values are now <strong>dynamically calculated</strong> instead of stored once when added.
              This means formula changes are automatically applied to all your fish.
              Some values may have changed, which could result in new swap recommendations.
            </p>
            <Button size="sm" variant="outline" onClick={() => settings.updateSettings({ pondSortNoticeDismissed: true })}>
              Got it!
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Pending Swaps Banner — only for auto-optimized loadouts */}
      {isAutoLoadout && swaps.length > 0 && !swapsDismissed && (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-amber-400">
              Pending Pond Swaps ({swaps.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {swaps.map((swap, i) => {
              const haveFish = swap.remove;
              const wantFish = swap.add;

              if (haveFish && wantFish) {
                return (
                  <div key={i} className="flex items-center gap-2">
                    <div className="flex-1 flex flex-col gap-0.5 min-w-0 bg-green-500/5 p-2 rounded-md border border-green-500/10">
                      <div className="text-xs font-semibold text-green-400 mb-1">Add</div>
                      <div className="bg-background/80 px-2 py-1.5 rounded text-sm border shadow-sm">
                        <div className="flex items-baseline gap-2 overflow-hidden">
                          <span className="font-medium truncate" style={{ color: getRarityColor(wantFish.fishName) }}>{wantFish.fishName}</span>
                          <span className="text-muted-foreground font-normal shrink-0"> | </span>
                          <span className="font-normal shrink-0" style={{ color: getWeightColor(wantFish.weight, wantFish.fishName, wantFish.mutation) }}>{wantFish.weight}kg</span>
                          <span className="text-muted-foreground font-normal shrink-0"> | </span>
                          {wantFish.stars > 0 && <><span className="font-normal shrink-0" style={{ color: STAR_COLOR }}>{wantFish.stars}★</span><span className="text-muted-foreground font-normal shrink-0"> | </span></>}
                          <span className="font-normal shrink-0" style={MUTATION_COLORS[wantFish.mutation] ? { color: MUTATION_COLORS[wantFish.mutation] } : undefined}>{wantFish.mutation}</span><span className="text-muted-foreground font-normal shrink-0"> | </span>
                          <span className="text-xs font-semibold shrink-0" style={{ color: getValueColor(Math.round(computeEntryValue(wantFish) * (cashBonus + 1)), allValues) }}>
                            ${Math.round(computeEntryValue(wantFish) * (cashBonus + 1)).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">${getDisplayRoe(wantFish).toLocaleString()}/hr</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 px-2 py-1 rounded bg-secondary/50 border">
                      <IconArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 flex flex-col gap-0.5 min-w-0 bg-red-500/5 p-2 rounded-md border border-red-500/10">
                      <div className="text-xs font-semibold text-red-400 mb-1">Remove</div>
                      <div className="bg-background/80 px-2 py-1.5 rounded text-sm border shadow-sm">
                        <div className="flex items-baseline gap-2 overflow-hidden">
                          <span className="font-medium truncate" style={{ color: getRarityColor(haveFish.fishName) }}>{haveFish.fishName}</span>
                          <span className="text-muted-foreground font-normal shrink-0"> | </span>
                          <span className="font-normal shrink-0" style={{ color: getWeightColor(haveFish.weight, haveFish.fishName, haveFish.mutation) }}>{haveFish.weight}kg</span>
                          <span className="text-muted-foreground font-normal shrink-0"> | </span>
                          {haveFish.stars > 0 && <><span className="font-normal shrink-0" style={{ color: STAR_COLOR }}>{haveFish.stars}★</span><span className="text-muted-foreground font-normal shrink-0"> | </span></>}
                          <span className="font-normal shrink-0" style={MUTATION_COLORS[haveFish.mutation] ? { color: MUTATION_COLORS[haveFish.mutation] } : undefined}>{haveFish.mutation}</span><span className="text-muted-foreground font-normal shrink-0"> | </span>
                          <span className="text-xs font-semibold shrink-0" style={{ color: getValueColor(Math.round(computeEntryValue(haveFish) * (cashBonus + 1)), allValues) }}>
                            ${Math.round(computeEntryValue(haveFish) * (cashBonus + 1)).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">${getDisplayRoe(haveFish).toLocaleString()}/hr</div>
                      </div>
                    </div>
                  </div>
                );
              } else if (wantFish) {
                return (
                  <div key={i} className="flex items-center gap-2 text-sm rounded-md bg-green-500/5 px-3 py-2 border border-green-500/10">
                    <span className="text-green-400 shrink-0">Add:</span>
                    <span style={{ color: getRarityColor(wantFish.fishName) }}>{wantFish.fishName}</span>
                    <span className="text-muted-foreground"> | </span>
                    <span style={{ color: getWeightColor(wantFish.weight, wantFish.fishName, wantFish.mutation) }}>{wantFish.weight}kg</span>
                    <span className="text-muted-foreground"> | </span>
                    {wantFish.stars > 0 && <><span style={{ color: STAR_COLOR }}>{wantFish.stars}★</span><span className="text-muted-foreground"> | </span></>}
                    <span style={MUTATION_COLORS[wantFish.mutation] ? { color: MUTATION_COLORS[wantFish.mutation] } : undefined}>{wantFish.mutation}</span><span className="text-muted-foreground"> | </span>
                    <span className="text-muted-foreground">${computeEntryValue(wantFish).toLocaleString()}</span>
                    <span className="text-muted-foreground">(${getDisplayRoe(wantFish).toLocaleString()}/hr)</span>
                  </div>
                );
              } else if (haveFish) {
                return (
                  <div key={i} className="flex items-center gap-2 text-sm rounded-md bg-red-500/5 px-3 py-2 border border-red-500/10">
                    <span className="text-red-400 shrink-0">Remove:</span>
                    <span style={{ color: getRarityColor(haveFish.fishName) }}>{haveFish.fishName}</span>
                    <span className="text-muted-foreground"> | </span>
                    <span style={{ color: getWeightColor(haveFish.weight, haveFish.fishName, haveFish.mutation) }}>{haveFish.weight}kg</span>
                    <span className="text-muted-foreground"> | </span>
                    {haveFish.stars > 0 && <><span style={{ color: STAR_COLOR }}>{haveFish.stars}★</span><span className="text-muted-foreground"> | </span></>}
                    <span style={MUTATION_COLORS[haveFish.mutation] ? { color: MUTATION_COLORS[haveFish.mutation] } : undefined}>{haveFish.mutation}</span><span className="text-muted-foreground"> | </span>
                    <span className="text-muted-foreground">${computeEntryValue(haveFish).toLocaleString()}</span>
                    <span className="text-muted-foreground">(${getDisplayRoe(haveFish).toLocaleString()}/hr)</span>
                  </div>
                );
              }
              return null;
            })}
            <div className="pt-2 flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
                onClick={handleUpdatePond}
              >
                Update Pond
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/30"
                onClick={() => {
                  const newIgnoredIds = swaps
                    .map((s) => s.add?.id)
                    .filter((id): id is string => !!id);
                  const updatedIgnored = [
                    ...settings.ignoredSwapFishIds,
                    ...newIgnoredIds.filter((id) => !settings.ignoredSwapFishIds.includes(id)),
                  ];
                  settings.updateSettings({ ignoredSwapFishIds: updatedIgnored });
                  setSwapsDismissed(true);
                  let undone = false;
                  const toastId = addToast({
                    variant: "info",
                    title: "Swap Suggestions Ignored",
                    description: `${newIgnoredIds.length} swap${newIgnoredIds.length !== 1 ? "s" : ""} will no longer be suggested.`,
                    action: (
                      <button
                        onClick={() => {
                          if (undone) return;
                          undone = true;
                          settings.updateSettings({
                            ignoredSwapFishIds: settings.ignoredSwapFishIds.filter(
                              (id) => !newIgnoredIds.includes(id)
                            ),
                          });
                          setSwapsDismissed(false);
                          removeToast(toastId);
                        }}
                        className="text-xs font-semibold underline underline-offset-2 hover:opacity-80"
                      >
                        Undo
                      </button>
                    ),
                  });
                }}
              >
                Ignore
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {pondFish.length === 0 && sorted.length === 0 && isAutoLoadout ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No fish in your log yet. Add fish in the Fish Log tab!
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between py-4">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onLoadoutChange((activeLoadoutIndex + 4) % 5)}
              >
                <IconChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-1.5">
                {isCustomLoadout && renamingLoadout ? (
                  <input
                    type="text"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={handleRenameSubmit}
                    onKeyDown={(e) => { if (e.key === "Enter") handleRenameSubmit(); if (e.key === "Escape") setRenamingLoadout(false); }}
                    autoFocus
                    className="text-base font-semibold bg-transparent border-b border-foreground/50 outline-none w-48"
                  />
                ) : (
                  <CardTitle className="text-base">
                    {getLoadoutName(activeLoadoutIndex, activeSnapshot)} ({pondFish.length}/{pondSize})
                  </CardTitle>
                )}
                {isCustomLoadout && !renamingLoadout && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => {
                      setRenameValue(activeSnapshot?.loadoutName || `Custom Loadout ${activeLoadoutIndex - 1}`);
                      setRenamingLoadout(true);
                    }}
                  >
                    <IconPencil className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => onLoadoutChange((activeLoadoutIndex + 1) % 5)}
              >
                <IconChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              {activeSnapshot && (
                <span className="text-xs text-muted-foreground">
                  Last updated: {formatTimeAgo(activeSnapshot.createdAt)}
                </span>
              )}
              {isCustomLoadout && pondFish.length < pondSize && (
                <>
                  <Button size="sm" variant="outline" onClick={() => setShowFishPicker(true)}>
                    <IconPlus className="h-3.5 w-3.5 mr-1" />
                    Pick Fish
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setShowAddForm(true); setAddFormKey((k) => k + 1); setOcrData(undefined); }}>
                    <IconPlus className="h-3.5 w-3.5 mr-1" />
                    New Fish
                  </Button>
                </>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {pondFish.length === 0 && isAutoLoadout ? (
              <div className="py-8 text-center text-muted-foreground">
                No fish in your pond yet. Press &quot;Update Pond&quot; above to populate it.
              </div>
            ) : pondFish.length === 0 && isCustomLoadout ? (
              <div className="py-8 text-center text-muted-foreground space-y-2">
                <p>This custom loadout is empty.</p>
                <p className="text-xs">Use &quot;Pick Fish&quot; to add from your log, or &quot;New Fish&quot; to add a new catch.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Rank</TableHead>
                    <TableHead>Fish</TableHead>
                    <TableHead>Weight</TableHead>
                    <TableHead>Stars</TableHead>
                    <TableHead>Mutation</TableHead>
                    <TableHead className="text-right">{valueLabel}</TableHead>
                    <TableHead className="text-right">{roeLabel}</TableHead>
                    <TableHead className="w-[140px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayPondFish.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium" style={{ color: getRankColor(rankMap.get(entry.id) ?? 0) }}>
                        #{rankMap.get(entry.id)}
                      </TableCell>
                      <TableCell style={{ color: getRarityColor(entry.fishName) }}>
                        {entry.fishName}
                      </TableCell>
                      <TableCell style={{ color: getWeightColor(entry.weight, entry.fishName, entry.mutation) }}>
                        {entry.weight}kg
                      </TableCell>
                      <TableCell style={entry.stars > 0 ? { color: STAR_COLOR } : undefined}>
                        {entry.stars === 0 ? "Dead" : `${entry.stars}\u2605`}
                      </TableCell>
                      <TableCell style={MUTATION_COLORS[entry.mutation] ? { color: MUTATION_COLORS[entry.mutation] } : undefined}>
                        {entry.mutation}
                      </TableCell>
                      <TableCell className="text-right font-medium" style={{ color: getValueColor(Math.round(computeEntryValue(entry) * (cashBonus + 1)), allValues) }}>
                        ${Math.round(computeEntryValue(entry) * (cashBonus + 1)).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-medium" style={{ color: getValueColor(getDisplayRoe(entry), allRoeValues) }}>
                        ${getDisplayRoe(entry).toLocaleString()}/hr
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleCopy(entry)}>
                            {copiedId === entry.id ? <IconCheck className="h-4 w-4" /> : <IconCopy className="h-4 w-4" />}
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openEdit(entry)}>
                            <IconEdit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleRemove(entry)}>
                            <IconTrash className="h-4 w-4" />
                          </Button>
                          <div className="relative">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setSendToPondId(sendToPondId === entry.id ? null : entry.id)}
                            >
                              <IconArrowRight className="h-4 w-4" />
                            </Button>
                            {sendToPondId === entry.id && (
                              <div className="absolute right-0 top-full mt-1 z-50 bg-popover border rounded-md shadow-md p-1 min-w-[180px]">
                                {[0, 1, 2, 3, 4]
                                  .filter((i) => i !== activeLoadoutIndex)
                                  .filter((i) => {
                                    // For auto loadouts, can only send to custom
                                    if (isAutoLoadout && i <= 1) return false;
                                    return true;
                                  })
                                  .map((i) => {
                                    const snap = pondSnapshots.find((s) => s.loadoutIndex === i);
                                    const count = snap?.fishIds.length ?? 0;
                                    const isFull = count >= pondSize;
                                    // Can't add to auto loadouts
                                    const isTargetAuto = i <= 1;
                                    return (
                                      <button
                                        key={i}
                                        disabled={isFull || isTargetAuto}
                                        className="w-full text-left px-3 py-1.5 text-sm rounded hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                                        onClick={() => handleMoveToPond(entry.id, i)}
                                      >
                                        {getLoadoutName(i, snap)} ({count}/{pondSize})
                                      </button>
                                    );
                                  })}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {/* Empty slots for custom loadouts */}
                  {isCustomLoadout && Array.from({ length: emptySlotCount }).map((_, i) => (
                    <TableRow key={`empty-${i}`} className="opacity-40">
                      <TableCell className="text-muted-foreground">-</TableCell>
                      <TableCell colSpan={6} className="text-muted-foreground italic">Empty Slot</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => setShowFishPicker(true)}>
                          <IconPlus className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      <PondPrediction pondFish={pondFish} />

      {/* Close send-to-pond dropdown on outside click */}
      {sendToPondId && (
        <div className="fixed inset-0 z-40" onClick={() => setSendToPondId(null)} />
      )}

      {/* Edit Modal */}
      {editModalOpen && editingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => { setEditModalOpen(false); setEditingEntry(null); }}>
          <div className="bg-card border rounded-lg p-6 w-full max-w-md mx-4 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Edit Fish</h3>
              <Button variant="ghost" size="icon" onClick={() => { setEditModalOpen(false); setEditingEntry(null); }}>
                <span className="text-lg">&times;</span>
              </Button>
            </div>
            <FishForm
              key={formKey}
              settings={{ race: settings.race, artifact1: settings.artifact1, artifact2: settings.artifact2, artifact3: settings.artifact3, roeStorageLevel: settings.roeStorageLevel, decorationLevel: settings.decorationLevel }}
              initialData={{
                fishName: editingEntry.fishName,
                weight: editingEntry.weight,
                stars: editingEntry.stars,
                mutation: editingEntry.mutation,
              }}
              renderActions={(formData) => (
                <Button className="w-full" disabled={!formData} onClick={() => formData && handleEditSubmit(formData)}>
                  Save Changes
                </Button>
              )}
            />
          </div>
        </div>
      )}

      {/* Add New Fish Modal (custom loadouts only) */}
      {showAddForm && isCustomLoadout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => { setShowAddForm(false); setOcrData(undefined); }}>
          <div className="bg-card border rounded-lg p-6 w-full max-w-md mx-4 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add New Fish to Pond</h3>
              <Button variant="ghost" size="icon" onClick={() => { setShowAddForm(false); setOcrData(undefined); }}>
                <span className="text-lg">&times;</span>
              </Button>
            </div>
            <ImagePasteZone onResult={handleOcrResult} />
            <FishForm
              key={addFormKey}
              settings={{ race: settings.race, artifact1: settings.artifact1, artifact2: settings.artifact2, artifact3: settings.artifact3, roeStorageLevel: settings.roeStorageLevel, decorationLevel: settings.decorationLevel }}
              initialData={ocrData}
              renderActions={(formData) => (
                <Button className="w-full" disabled={!formData} onClick={() => formData && handleAddSubmit(formData)}>
                  Add to Log & Pond
                </Button>
              )}
            />
          </div>
        </div>
      )}

      {/* Fish Picker Modal */}
      {showFishPicker && isCustomLoadout && (
        <FishPickerModal
          entries={entries}
          currentFishIds={activeSnapshot?.fishIds ?? []}
          pondSize={pondSize}
          getDisplayRoe={getDisplayRoe}
          cashBonus={cashBonus}
          onSelect={async (fishId) => {
            const snap = activeSnapshot;
            const fishIds = snap ? [...snap.fishIds, fishId] : [fishId];
            await onUpdateSnapshot(activeLoadoutIndex, fishIds, pondSize);
            setShowFishPicker(false);
          }}
          onClose={() => setShowFishPicker(false)}
        />
      )}
    </div>
  );
}
