
"use client";

import * as React from "react";
import { type FishEntry } from "@/lib/types";
import { type PondSnapshotData } from "@/lib/fish-actions";
import {
  MUTATIONS,
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
} from "@/lib/fish-config";
import { calculateBaseRoePerHour, calculateBoostedRoePerHour } from "@/lib/fish-utils";
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
import { IconArrowRight } from "@tabler/icons-react";

const POND_SIZES = [6, 8, 10, 12, 14, 16, 18]; // This array is no longer used directly for the Select options, but kept for reference if needed elsewhere.

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
  allSorted: FishEntry[]
): SwapEntry[] {
  const idealIds = new Set(idealPondFish.map((f) => f.id));
  const snapshotIds = new Set(snapshot.fishIds);

  // Fish in ideal pond but not in snapshot = need to be added in-game
  const toAdd = idealPondFish.filter((f) => !snapshotIds.has(f.id));

  // Fish in snapshot but not in ideal pond = need to be removed in-game
  const toRemove: FishEntry[] = [];
  for (const id of snapshot.fishIds) {
    if (idealIds.has(id)) continue;
    const found = allSorted.find((f) => f.id === id);
    if (found) toRemove.push(found);
  }

  // Sort: removes by value ascending (weakest first), adds by value descending (strongest first)
  toRemove.sort((a, b) => a.value - b.value);
  toAdd.sort((a, b) => b.value - a.value);

  const swaps: SwapEntry[] = [];
  const maxPairs = Math.max(toRemove.length, toAdd.length);
  for (let i = 0; i < maxPairs; i++) {
    swaps.push({
      remove: toRemove[i],
      add: toAdd[i],
    });
  }

  return swaps;
}

interface FishPondTabProps {
  entries: FishEntry[];
  snapshot: PondSnapshotData | null;
  onUpdateSnapshot: (fishIds: string[], pondSize: number) => Promise<void>;
  onPondSizeChange: (size: number) => Promise<void>;
  isActive: boolean;
}

export function FishPondTab({
  entries,
  snapshot,
  onUpdateSnapshot,
  onPondSizeChange,
  isActive,
}: FishPondTabProps) {
  const settings = useSettings();
  const [autoSaved, setAutoSaved] = React.useState(false);
  const [pondSize, setPondSize] = React.useState(snapshot?.pondSize ?? 6);
  const [showSortNotice, setShowSortNotice] = React.useState(false);
  const swapsDismissKey = snapshot ? `pondSwapsDismissed-${snapshot.createdAt}` : null;
  const [swapsDismissed, setSwapsDismissed] = React.useState(() => {
    if (typeof window === "undefined" || !snapshot) return false;
    return !!localStorage.getItem(`pondSwapsDismissed-${snapshot.createdAt}`);
  });

  React.useEffect(() => {
    if (snapshot?.pondSize && snapshot.pondSize !== pondSize) {
      setPondSize(snapshot.pondSize);
    }
  }, [snapshot?.pondSize, pondSize]);

  React.useEffect(() => {
    if (isActive && !localStorage.getItem("pondSortNoticeDismissed")) {
      setShowSortNotice(true);
    }
  }, [isActive]);

  const dismissSortNotice = () => {
    localStorage.setItem("pondSortNoticeDismissed", "true");
    setShowSortNotice(false);
  };

  // 1) Sort ALL user's fish by base Roe $/hr instead of value
  const sorted = React.useMemo(() => {
    return [...entries].sort((a, b) => {
      const aFish = FISH_SPECIES.find((f) => f.name === a.fishName);
      const bFish = FISH_SPECIES.find((f) => f.name === b.fishName);
      const aRoe = aFish ? calculateBaseRoePerHour(a.value, a.mutation !== "None", aFish.rarity) : 0;
      const bRoe = bFish ? calculateBaseRoePerHour(b.value, b.mutation !== "None", bFish.rarity) : 0;
      return bRoe - aRoe;
    });
  }, [entries]);

  // The ideal top-N pond (what rankings say should be in the pond)
  const idealPond = sorted.slice(0, pondSize);

  // The fish actually in the pond (from snapshot) — what's shown in "Your Pond"
  const pondFish = React.useMemo(() => {
    if (!snapshot) return [];
    const found: FishEntry[] = [];
    for (const id of snapshot.fishIds) {
      const entry = entries.find((e) => e.id === id);
      if (entry) found.push(entry);
    }
    return found;
  }, [snapshot, entries]);

  // Provide a quick lookup to rank index in the sorted array (by roe $/hr)
  const rankMap = React.useMemo(() => {
    const map = new Map<string, number>();
    sorted.forEach((e, idx) => map.set(e.id, idx + 1));
    return map;
  }, [sorted]);

  const allValues = React.useMemo(() => entries.map((e) => e.value), [entries]);

  const globalSettings = React.useMemo(() => ({
    race: settings.race,
    artifact1: settings.artifact1,
    artifact2: settings.artifact2,
    artifact3: settings.artifact3,
  }), [settings.race, settings.artifact1, settings.artifact2, settings.artifact3]);

  const { cashBonus, speedBonus, boostMultiplier } = React.useMemo(() => {
    const r = RACES.find((r) => r.name === settings.race)?.cashBonus ?? 0;
    const a1 = ARTIFACTS.find((a) => a.name === settings.artifact1)?.cashBonus ?? 0;
    const a2 = ARTIFACTS.find((a) => a.name === settings.artifact2)?.cashBonus ?? 0;
    const a3 = ARTIFACTS.find((a) => a.name === settings.artifact3)?.cashBonus ?? 0;
    const cashMultiplier = (1 + (a1 + a2 + a3)) * (1 + r);
    const speed = DECORATION_LEVELS[settings.decorationLevel]?.speedBonus ?? 0;
    return {
      cashBonus: cashMultiplier - 1,
      speedBonus: speed,
      boostMultiplier: cashMultiplier * (1 + speed),
    };
  }, [settings.race, settings.artifact1, settings.artifact2, settings.artifact3, settings.decorationLevel]);

  const valueLabel = cashBonus > 0.00005
    ? `Value (+${Number((cashBonus * 100).toFixed(4))}%)`
    : "Value";

  const roeLabel = (cashBonus + speedBonus) > 0.00005
    ? `Roe $/hr (+${Number(((cashBonus + speedBonus) * 100).toFixed(4))}%)`
    : "Roe $/hr";

  const getDisplayRoe = React.useCallback((entry: FishEntry) => {
    const fish = FISH_SPECIES.find((f) => f.name === entry.fishName);
    if (!fish) return 0;
    const base = calculateBaseRoePerHour(entry.value, entry.mutation !== "None", fish.rarity);
    return Math.round(calculateBoostedRoePerHour(base, globalSettings, settings.decorationLevel, 0, false));
  }, [globalSettings, settings.decorationLevel]);

  const allRoeValues = React.useMemo(() => pondFish.map(getDisplayRoe), [pondFish, getDisplayRoe]);

  // Display pond fish sorted by roe $/hr descending
  const displayPondFish = React.useMemo(
    () => [...pondFish].sort((a, b) => getDisplayRoe(b) - getDisplayRoe(a)),
    [pondFish, getDisplayRoe]
  );

  // Auto-save snapshot on first visit (no existing snapshot)
  React.useEffect(() => {
    if (autoSaved) return;
    if (snapshot === null && idealPond.length > 0) {
      setAutoSaved(true);
      // New user — mark notice as seen so they never see the "sorting changed" banner
      localStorage.setItem("pondSortNoticeDismissed", "true");
      onUpdateSnapshot(idealPond.map((f) => f.id), pondSize);
    }
  }, [snapshot, idealPond, pondSize, onUpdateSnapshot, autoSaved]);

  // Compute pending swaps (diff between ideal and snapshot)
  const swaps = React.useMemo(() => {
    if (!snapshot || idealPond.length === 0) return [];
    return computeSwaps(idealPond, snapshot, sorted);
  }, [snapshot, idealPond, sorted]);

  // When snapshot changes, re-check if the new snapshot's swaps are dismissed
  React.useEffect(() => {
    if (typeof window === "undefined" || !snapshot) return;
    setSwapsDismissed(!!localStorage.getItem(`pondSwapsDismissed-${snapshot.createdAt}`));
  }, [snapshot?.createdAt]);

  const handleUpdatePond = React.useCallback(async () => {
    await onUpdateSnapshot(idealPond.map((f) => f.id), pondSize);
  }, [idealPond, pondSize, onUpdateSnapshot]);

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
                {[6, 8, 10, 12, 14, 16, 18].map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num} Fish
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Sort Notice */}
      {showSortNotice && (
        <Card className="border-blue-500/50 bg-blue-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-blue-400">
              Pond Sorting Update!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              Your pond is now sorted by <strong>Roe $/hr</strong> instead of fish value.
              This is a more accurate metric for maximizing your passive income.
            </p>
            <Button size="sm" variant="outline" onClick={dismissSortNotice}>
              Got it!
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Pending Swaps Banner */}
      {swaps.length > 0 && !swapsDismissed && (
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
                        <div className="flex items-baseline justify-between gap-2 overflow-hidden">
                          <span
                            className="font-medium truncate"
                            style={{ color: getRarityColor(wantFish.fishName) }}
                          >
                            {wantFish.fishName}
                          </span>
                          <span
                            className="text-xs font-semibold shrink-0"
                            style={{ color: getValueColor(wantFish.value, allValues) }}
                          >
                            ${wantFish.value.toLocaleString()}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          ${getDisplayRoe(wantFish).toLocaleString()}/hr
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 px-2 py-1 rounded bg-secondary/50 border">
                      <IconArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 flex flex-col gap-0.5 min-w-0 bg-red-500/5 p-2 rounded-md border border-red-500/10">
                      <div className="text-xs font-semibold text-red-400 mb-1">Remove</div>
                      <div className="bg-background/80 px-2 py-1.5 rounded text-sm border shadow-sm">
                        <div className="flex items-baseline justify-between gap-2 overflow-hidden">
                          <span
                            className="font-medium truncate"
                            style={{ color: getRarityColor(haveFish.fishName) }}
                          >
                            {haveFish.fishName}
                          </span>
                          <span
                            className="text-xs font-semibold shrink-0"
                            style={{ color: getValueColor(haveFish.value, allValues) }}
                          >
                            ${haveFish.value.toLocaleString()}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          ${getDisplayRoe(haveFish).toLocaleString()}/hr
                        </div>
                      </div>
                    </div>
                  </div>
                );
              } else if (wantFish) {
                return (
                  <div key={i} className="flex items-center gap-2 text-sm rounded-md bg-green-500/5 px-3 py-2 border border-green-500/10">
                    <span className="text-green-400 shrink-0">Add:</span>
                    <span style={{ color: getRarityColor(wantFish.fishName) }}>
                      {wantFish.fishName}
                    </span>
                    <span className="text-muted-foreground">
                      ({wantFish.weight}kg, ${wantFish.value.toLocaleString()})
                    </span>
                    <span className="text-muted-foreground">
                      (${getDisplayRoe(wantFish).toLocaleString()}/hr)
                    </span>
                  </div>
                );
              } else if (haveFish) {
                return (
                  <div key={i} className="flex items-center gap-2 text-sm rounded-md bg-red-500/5 px-3 py-2 border border-red-500/10">
                    <span className="text-red-400 shrink-0">Remove:</span>
                    <span style={{ color: getRarityColor(haveFish.fishName) }}>
                      {haveFish.fishName}
                    </span>
                    <span className="text-muted-foreground">
                      ({haveFish.weight}kg, ${haveFish.value.toLocaleString()})
                    </span>
                    <span className="text-muted-foreground">
                      (${getDisplayRoe(haveFish).toLocaleString()}/hr)
                    </span>
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
                  if (swapsDismissKey) localStorage.setItem(swapsDismissKey, "true");
                  setSwapsDismissed(true);
                }}
              >
                Ignore
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {pondFish.length === 0 && sorted.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No fish in your log yet. Add fish in the Fish Log tab!
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between py-4">
            <CardTitle className="text-base">
              Your Pond ({pondFish.length}/{pondSize})
            </CardTitle>
            {snapshot && (
              <span className="text-xs text-muted-foreground">
                Last updated: {formatTimeAgo(snapshot.createdAt)}
              </span>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {pondFish.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                No fish in your pond yet. Press &quot;Update Pond&quot; above to populate it.
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
                      <TableCell
                        style={{ color: getWeightColor(entry.weight, entry.fishName) }}
                      >
                        {entry.weight}kg
                      </TableCell>
                      <TableCell
                        style={entry.stars > 0 ? { color: STAR_COLOR } : undefined}
                      >
                        {entry.stars === 0 ? "Dead" : `${entry.stars}\u2605`}
                      </TableCell>
                      <TableCell
                        style={
                          MUTATION_COLORS[entry.mutation]
                            ? { color: MUTATION_COLORS[entry.mutation] }
                            : undefined
                        }
                      >
                        {entry.mutation}
                      </TableCell>
                      <TableCell
                        className="text-right font-medium"
                        style={{ color: getValueColor(entry.value, allValues) }}
                      >
                        ${entry.value.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-medium" style={{ color: getValueColor(getDisplayRoe(entry), allRoeValues) }}>
                        ${getDisplayRoe(entry).toLocaleString()}/hr
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
    </div>
  );
}
