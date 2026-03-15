"use client";

import * as React from "react";
import { type FishEntry } from "@/lib/types";
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
import { getRarityColor, MUTATION_COLORS, STAR_COLOR, getWeightColor, getRankColor, getValueColor, getOptimizationColor } from "@/lib/fish-config";
import { getPrevRankings, savePrevRankings, getPrevPondSnapshot, savePrevPondSnapshot } from "@/lib/fish-storage";
import {
  IconArrowUp,
  IconArrowDown,
  IconMinus,
} from "@tabler/icons-react";

const POND_SIZES = [6, 8, 10, 12, 14, 16, 18];

interface FishPondTabProps {
  entries: FishEntry[];
  pondSize: number;
  onPondSizeChange: (size: number) => void;
  isActive: boolean;
}

export function FishPondTab({
  entries,
  pondSize,
  onPondSizeChange,
  isActive,
}: FishPondTabProps) {
  const [prevRankings, setPrevRankings] = React.useState<
    Record<string, number>
  >({});
  const [prevPondIds, setPrevPondIds] = React.useState<Set<string>>(new Set());
  const [removedEntries, setRemovedEntries] = React.useState<FishEntry[]>([]);

  React.useEffect(() => {
    setPrevRankings(getPrevRankings());
    // Seed snapshot if none exists so we have a baseline
    const existing = getPrevPondSnapshot();
    if (existing.length === 0) {
      const initial = [...entries]
        .filter((e) => e.stars !== 0)
        .sort((a, b) => b.value - a.value)
        .slice(0, 18);
      if (initial.length > 0) savePrevPondSnapshot(initial);
    }
  }, []);

  // Filter out dead fish (stars === 0), then sort by value descending
  const sorted = React.useMemo(
    () =>
      [...entries]
        .filter((e) => e.stars !== 0)
        .sort((a, b) => b.value - a.value),
    [entries]
  );

  const currentRankings = React.useMemo(() => {
    const map: Record<string, number> = {};
    sorted.forEach((e, i) => {
      map[e.id] = i + 1;
    });
    return map;
  }, [sorted]);

  React.useEffect(() => {
    if (sorted.length > 0) {
      savePrevRankings(currentRankings);
    }
  }, [currentRankings, sorted.length]);

  const allValues = React.useMemo(
    () => sorted.map((e) => e.value),
    [sorted]
  );

  const pondFish = sorted.slice(0, pondSize);
  const reserveFish = sorted.slice(pondSize, 18);
  const showReserve = pondSize < 18 && reserveFish.length > 0;

  // All ranked fish (pond + reserve, max 18)
  const allRanked = sorted.slice(0, 18);

  // Load previous snapshot when tab activates, save when it deactivates
  const prevIsActive = React.useRef(false);
  React.useEffect(() => {
    if (isActive && !prevIsActive.current) {
      const snapshot = getPrevPondSnapshot();
      const snapshotIds = new Set(snapshot.map((e) => e.id));
      setPrevPondIds(snapshotIds);

      // Find entries that were ranked before but aren't now
      const currentIds = new Set(allRanked.map((e) => e.id));
      const removed = snapshot.filter((e) => !currentIds.has(e.id));
      setRemovedEntries(removed);
    }
    if (!isActive && prevIsActive.current) {
      savePrevPondSnapshot(allRanked);
      setPrevPondIds(new Set());
      setRemovedEntries([]);
    }
    prevIsActive.current = isActive;
  }, [isActive, allRanked]);

  const isNewToRanked = (id: string) =>
    prevPondIds.size > 0 && !prevPondIds.has(id);

  const hasChanges = removedEntries.length > 0 || allRanked.some((e) => isNewToRanked(e.id));

  const getRankChange = (id: string) => {
    const prev = prevRankings[id];
    const curr = currentRankings[id];
    if (prev === undefined) return "new";
    if (prev < curr) return "down";
    if (prev > curr) return "up";
    return "same";
  };

  const RankIndicator = ({ id }: { id: string }) => {
    const change = getRankChange(id);
    if (change === "new") {
      return <span className="text-xs font-medium text-blue-400">NEW</span>;
    }
    if (change === "up") {
      return <IconArrowUp className="h-4 w-4 text-green-400" />;
    }
    if (change === "down") {
      return <IconArrowDown className="h-4 w-4 text-red-400" />;
    }
    return <IconMinus className="h-4 w-4 text-muted-foreground" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Fish Pond</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Pond Size:</span>
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

      {hasChanges && (
        <Card className="border-border/60">
          <CardHeader className="py-3">
            <CardTitle className="text-sm text-muted-foreground">Recent Changes</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableBody>
                {pondFish.filter((e) => isNewToRanked(e.id)).map((entry) => (
                  <TableRow key={`added-${entry.id}`} className="bg-green-500/10 border-l-2 border-l-green-500">
                    <TableCell className="w-10 text-green-400 font-mono">+</TableCell>
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
                    <TableCell className="text-right font-medium">
                      ${entry.value.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
                {removedEntries.map((entry) => (
                  <TableRow key={`removed-${entry.id}`} className="bg-red-500/10 border-l-2 border-l-red-500">
                    <TableCell className="w-10 text-red-400 font-mono">−</TableCell>
                    <TableCell className="text-muted-foreground">
                      {entry.fishName}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {entry.weight}kg
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {`${entry.stars}\u2605`}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {entry.mutation}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      ${entry.value.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {sorted.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {entries.length === 0
              ? "No fish in your log yet. Add fish in the Fish Log tab!"
              : "No living fish to put in your pond!"}
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Your Pond ({pondFish.length}/{pondSize})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Rank</TableHead>
                    <TableHead className="w-12"></TableHead>
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
                    <TableRow key={entry.id} className={isNewToRanked(entry.id) ? "bg-green-500/10 border-l-2 border-l-green-500" : ""}>
                      <TableCell className="font-medium" style={{ color: getRankColor(i + 1) }}>#{i + 1}</TableCell>
                      <TableCell>
                        <RankIndicator id={entry.id} />
                      </TableCell>
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
            </CardContent>
          </Card>

          {showReserve && (
            <Card className="opacity-75">
              <CardHeader>
                <CardTitle className="text-base text-muted-foreground">
                  Reserve
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Rank</TableHead>
                      <TableHead className="w-12"></TableHead>
                      <TableHead>Fish</TableHead>
                      <TableHead>Weight</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                      <TableHead className="text-right">Opt %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reserveFish.map((entry, i) => (
                      <TableRow key={entry.id} className={isNewToRanked(entry.id) ? "bg-green-500/10 border-l-2 border-l-green-500" : ""}>
                        <TableCell className="font-medium" style={{ color: getRankColor(pondSize + i + 1), opacity: 0.6 }}>
                          #{pondSize + i + 1}
                        </TableCell>
                        <TableCell>
                          <RankIndicator id={entry.id} />
                        </TableCell>
                        <TableCell style={{ color: getRarityColor(entry.fishName), opacity: 0.6 }}>
                          {entry.fishName}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {entry.weight}kg
                        </TableCell>
                        <TableCell className="text-right" style={{ color: getValueColor(entry.value, allValues), opacity: 0.6 }}>
                          ${entry.value.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right" style={{ color: getOptimizationColor(entry.optimization), opacity: 0.6 }}>
                          {entry.optimization.toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
