"use client";

import * as React from "react";
import { type FishEntry } from "@/lib/types";
import {
  FISH_SPECIES,
  getRarityColor,
  MUTATION_COLORS,
  STAR_COLOR,
  getWeightColor,
  getValueColor,
} from "@/lib/fish-config";
import { computeEntryValue } from "@/lib/fish-utils";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface FishPickerModalProps {
  entries: FishEntry[];
  currentFishIds: string[];
  pondSize: number;
  getDisplayRoe: (entry: FishEntry) => number;
  cashBonus: number;
  onSelect: (fishId: string) => Promise<void>;
  onClose: () => void;
}

export function FishPickerModal({
  entries,
  currentFishIds,
  pondSize,
  getDisplayRoe,
  cashBonus,
  onSelect,
  onClose,
}: FishPickerModalProps) {
  const [search, setSearch] = React.useState("");
  const currentIds = new Set(currentFishIds);
  const slotsRemaining = pondSize - currentFishIds.length;

  const filtered = React.useMemo(() => {
    const available = entries.filter((e) => !currentIds.has(e.id));
    const sorted = [...available].sort((a, b) => getDisplayRoe(b) - getDisplayRoe(a));
    if (!search.trim()) return sorted;
    const q = search.toLowerCase();
    return sorted.filter((e) => e.fishName.toLowerCase().includes(q));
  }, [entries, currentIds, search, getDisplayRoe]);

  const allValues = React.useMemo(
    () => filtered.map((e) => Math.round(computeEntryValue(e) * (cashBonus + 1))),
    [filtered, cashBonus]
  );

  const allRoeValues = React.useMemo(
    () => filtered.map(getDisplayRoe),
    [filtered, getDisplayRoe]
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="bg-card border rounded-lg w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">
            Pick Fish ({slotsRemaining} slot{slotsRemaining !== 1 ? "s" : ""} remaining)
          </h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <span className="text-lg">&times;</span>
          </Button>
        </div>
        <div className="p-4 border-b">
          <Input
            placeholder="Search by fish name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>
        <div className="overflow-y-auto flex-1">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              {search ? "No fish match your search." : "No available fish to add."}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fish</TableHead>
                  <TableHead>Weight</TableHead>
                  <TableHead>Stars</TableHead>
                  <TableHead>Mutation</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead className="text-right">Roe $/hr</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((entry) => (
                  <TableRow
                    key={entry.id}
                    className="cursor-pointer hover:bg-accent/50"
                    onClick={() => onSelect(entry.id)}
                  >
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
}
