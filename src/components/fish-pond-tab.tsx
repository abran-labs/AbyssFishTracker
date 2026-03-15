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

const POND_SIZES = [6, 8, 10, 12, 14, 16, 18];

interface FishPondTabProps {
  entries: FishEntry[];
  pondSize: number;
  onPondSizeChange: (size: number) => void | Promise<void>;
  isActive: boolean;
}

export function FishPondTab({
  entries,
  pondSize,
  onPondSizeChange,
}: FishPondTabProps) {
  // Filter out dead fish (stars === 0), then sort by value descending
  const sorted = React.useMemo(
    () =>
      [...entries]
        .filter((e) => e.stars !== 0)
        .sort((a, b) => b.value - a.value),
    [entries]
  );

  const allValues = React.useMemo(
    () => sorted.map((e) => e.value),
    [sorted]
  );

  const pondFish = sorted.slice(0, pondSize);
  const reserveFish = sorted.slice(pondSize, 18);
  const showReserve = pondSize < 18 && reserveFish.length > 0;

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
                      <TableHead>Fish</TableHead>
                      <TableHead>Weight</TableHead>
                      <TableHead className="text-right">Value</TableHead>
                      <TableHead className="text-right">Opt %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reserveFish.map((entry, i) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-medium" style={{ color: getRankColor(pondSize + i + 1), opacity: 0.6 }}>
                          #{pondSize + i + 1}
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
