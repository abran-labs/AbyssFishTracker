"use client";

import * as React from "react";
import { type FishEntry } from "@/lib/types";
import { type PondSnapshotData } from "@/lib/fish-actions";
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
import { useToast } from "@/components/ui/toast-context";
import { getRarityColor, MUTATION_COLORS, STAR_COLOR, getWeightColor, getRankColor, getValueColor, getOptimizationColor } from "@/lib/fish-config";

const POND_SIZES = [6, 8, 10, 12, 14, 16, 18];

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
}: FishPondTabProps) {
  const { addToast } = useToast();
  const [autoSaved, setAutoSaved] = React.useState(false);

  const pondSize = snapshot?.pondSize ?? 6;

  // Filter out dead fish (stars === 0), then sort by value descending
  const sorted = React.useMemo(
    () =>
      [...entries]
        .filter((e) => e.stars !== 0)
        .sort((a, b) => b.value - a.value),
    [entries]
  );

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

  const allValues = React.useMemo(
    () => sorted.map((e) => e.value),
    [sorted]
  );

  // Auto-save snapshot on first visit (no existing snapshot)
  React.useEffect(() => {
    if (autoSaved) return;
    if (snapshot === null && idealPond.length > 0) {
      setAutoSaved(true);
      onUpdateSnapshot(idealPond.map((f) => f.id), pondSize);
    }
  }, [snapshot, idealPond, pondSize, onUpdateSnapshot, autoSaved]);

  // Compute pending swaps (diff between ideal and snapshot)
  const swaps = React.useMemo(() => {
    if (!snapshot || idealPond.length === 0) return [];
    return computeSwaps(idealPond, snapshot, sorted);
  }, [snapshot, idealPond, sorted]);

  const handleUpdatePond = React.useCallback(async () => {
    await onUpdateSnapshot(idealPond.map((f) => f.id), pondSize);
    addToast({
      variant: "success",
      title: "Pond Updated",
      description: "Your pond has been updated to the ideal ranking.",
    });
  }, [idealPond, pondSize, onUpdateSnapshot, addToast]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Fish Pond</h2>
        <div className="flex items-center gap-2">
          {snapshot && (
            <span className="text-xs text-muted-foreground mr-2">
              Last updated: {formatTimeAgo(snapshot.createdAt)}
            </span>
          )}
          <span className="text-sm text-muted-foreground">Slots:</span>
          <Select
            value={pondSize.toString()}
            onValueChange={(v) => onPondSizeChange(parseInt(v, 10))}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {POND_SIZES.map((s) => (
                <SelectItem key={s} value={s.toString()}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Pending Swaps Banner */}
      {swaps.length > 0 && (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-amber-400">
              Pending Pond Swaps ({swaps.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {swaps.map((swap, i) => (
              <div
                key={i}
                className="flex items-center gap-2 text-sm rounded-md bg-background/50 px-3 py-2"
              >
                {swap.remove && swap.add ? (
                  <>
                    <span className="text-red-400 shrink-0">Remove:</span>
                    <span style={{ color: getRarityColor(swap.remove.fishName) }}>
                      {swap.remove.fishName}
                    </span>
                    <span className="text-muted-foreground">
                      ({swap.remove.weight}kg, ${swap.remove.value.toLocaleString()})
                    </span>
                    <span className="text-muted-foreground mx-1">&rarr;</span>
                    <span className="text-green-400 shrink-0">Add:</span>
                    <span style={{ color: getRarityColor(swap.add.fishName) }}>
                      {swap.add.fishName}
                    </span>
                    <span className="text-muted-foreground">
                      ({swap.add.weight}kg, ${swap.add.value.toLocaleString()})
                    </span>
                  </>
                ) : swap.add ? (
                  <>
                    <span className="text-green-400 shrink-0">Add:</span>
                    <span style={{ color: getRarityColor(swap.add.fishName) }}>
                      {swap.add.fishName}
                    </span>
                    <span className="text-muted-foreground">
                      ({swap.add.weight}kg, ${swap.add.value.toLocaleString()})
                    </span>
                  </>
                ) : swap.remove ? (
                  <>
                    <span className="text-red-400 shrink-0">Remove:</span>
                    <span style={{ color: getRarityColor(swap.remove.fishName) }}>
                      {swap.remove.fishName}
                    </span>
                    <span className="text-muted-foreground">
                      ({swap.remove.weight}kg, ${swap.remove.value.toLocaleString()})
                    </span>
                  </>
                ) : null}
              </div>
            ))}
            <div className="pt-2">
              <Button
                size="sm"
                variant="outline"
                className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
                onClick={handleUpdatePond}
              >
                Update Pond
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
          <CardHeader>
            <CardTitle className="text-base">
              Your Pond ({pondFish.length}/{pondSize})
            </CardTitle>
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
                    <TableHead className="text-right">Value</TableHead>
                    <TableHead className="text-right">Opt %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pondFish.map((entry, i) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium" style={{ color: getRankColor(i + 1) }}>#{i + 1}</TableCell>
                      <TableCell style={{ color: getRarityColor(entry.fishName) }}>
                        {entry.fishName}
                      </TableCell>
                      <TableCell style={{ color: getWeightColor(entry.weight, entry.fishName) }}>
                        {entry.weight}kg
                      </TableCell>
                      <TableCell style={{ color: STAR_COLOR }}>
                        {`${entry.stars}\u2605`}
                      </TableCell>
                      <TableCell style={MUTATION_COLORS[entry.mutation] ? { color: MUTATION_COLORS[entry.mutation] } : undefined}>
                        {entry.mutation}
                      </TableCell>
                      <TableCell className="text-right font-medium" style={{ color: getValueColor(entry.value, allValues) }}>
                        ${entry.value.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right" style={{ color: getOptimizationColor(entry.optimization) }}>
                        {entry.optimization.toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
