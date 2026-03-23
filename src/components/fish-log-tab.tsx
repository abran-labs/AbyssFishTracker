"use client";

import * as React from "react";
import { FishForm, type FishFormData } from "@/components/fish-form";
import { ImagePasteZone } from "@/components/image-paste-zone";
import { type OcrResult } from "@/lib/ocr";
import { type FishEntry } from "@/lib/types";
import { type PondSnapshotData } from "@/lib/fish-actions";
import { MUTATIONS, FISH_SPECIES, getRarityColor, MUTATION_COLORS, STAR_COLOR, getWeightColor, getRankColor, getValueColor, RACES, ARTIFACTS, DECORATION_LEVELS } from "@/lib/fish-config";
import { calculateBaseRoePerHour, computeEntryValue } from "@/lib/fish-utils";
import { useSettings } from "@/components/settings-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/data-table";
import { useToast } from "@/components/ui/toast-context";
import {
  IconEdit,
  IconTrash,
  IconPlus,
  IconX,
  IconChevronUp,
  IconChevronDown,
  IconSelector,
  IconCopy,
  IconCheck,
  IconArrowRight,
} from "@tabler/icons-react";

type SortKey =
  | "rank"
  | "fishName"
  | "weight"
  | "stars"
  | "mutation"
  | "value"
  | "roePerHour"
  | "createdAt";
type SortDir = "asc" | "desc";

const DEFAULT_DIR: Record<SortKey, SortDir> = {
  rank: "asc",
  fishName: "asc",
  weight: "desc",
  stars: "desc",
  mutation: "desc",
  value: "desc",
  roePerHour: "desc",
  createdAt: "desc",
};

const mutationMultiplierMap = new Map(
  MUTATIONS.map((m) => [m.name, m.multiplier])
);

const FISH_LOG_SUBTAB_KEY = "fishLogSubTab";

const LOADOUT_NAMES: Record<number, string> = {
  0: "ROE $/hr Optimized",
  1: "Balanced $/hr + kg/hr",
};

function getLoadoutName(index: number, snapshot?: PondSnapshotData | null): string {
  if (index <= 1) return LOADOUT_NAMES[index];
  return snapshot?.loadoutName || `Custom Loadout ${index - 1}`;
}

interface FishLogTabProps {
  entries: FishEntry[];
  pondSnapshots: PondSnapshotData[];
  onAdd: (
    data: Omit<FishEntry, "id" | "createdAt" | "updatedAt">
  ) => FishEntry | Promise<FishEntry>;
  onUpdate: (
    id: string,
    data: Omit<FishEntry, "id" | "createdAt" | "updatedAt">
  ) => FishEntry | Promise<FishEntry>;
  onDelete: (id: string) => void | Promise<void>;
  onRestore: (entry: FishEntry) => void | Promise<void>;
  onSendToPond: (fishId: string, loadoutIndex: number) => Promise<void>;
}

function SortableHead({
  label,
  sortKey,
  activeSortKey,
  sortDir,
  onSort,
  className,
}: {
  label: string;
  sortKey: SortKey;
  activeSortKey: SortKey;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
  className?: string;
}) {
  const isActive = activeSortKey === sortKey;
  return (
    <TableHead className={className}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
      >
        {label}
        {isActive ? (
          sortDir === "asc" ? (
            <IconChevronUp className="h-3.5 w-3.5" />
          ) : (
            <IconChevronDown className="h-3.5 w-3.5" />
          )
        ) : (
          <IconSelector className="h-3.5 w-3.5 opacity-30" />
        )}
      </button>
    </TableHead>
  );
}

const MAX_POND = 18;

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

export function FishLogTab({
  entries,
  pondSnapshots,
  onAdd,
  onUpdate,
  onDelete,
  onRestore,
  onSendToPond,
}: FishLogTabProps) {
  const [subTab, setSubTab] = React.useState<"active" | "archive">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(FISH_LOG_SUBTAB_KEY);
      if (saved === "active" || saved === "archive") return saved;
    }
    return "active";
  });
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editingEntry, setEditingEntry] = React.useState<FishEntry | null>(
    null
  );
  const [formKey, setFormKey] = React.useState(0);
  const [ocrData, setOcrData] = React.useState<{
    fishName?: string;
    weight?: number;
    stars?: number;
    mutation?: string;
  } | undefined>(undefined);
  const [sortKey, setSortKey] = React.useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = React.useState<SortDir>("desc");
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [sendToPondId, setSendToPondId] = React.useState<string | null>(null);
  const { addToast, removeToast } = useToast();

  const handleSubTabChange = (tab: "active" | "archive") => {
    setSubTab(tab);
    localStorage.setItem(FISH_LOG_SUBTAB_KEY, tab);
  };

  React.useEffect(() => {
    if (modalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [modalOpen]);
  const { race, artifact1, artifact2, artifact3, decorationLevel, roeStorageLevel } = useSettings();

  const { cashBonus, speedBonus, boostMultiplier } = React.useMemo(() => {
    const r = RACES.find((r) => r.name === race)?.cashBonus ?? 0;
    const a1 = ARTIFACTS.find((a) => a.name === artifact1)?.cashBonus ?? 0;
    const a2 = ARTIFACTS.find((a) => a.name === artifact2)?.cashBonus ?? 0;
    const a3 = ARTIFACTS.find((a) => a.name === artifact3)?.cashBonus ?? 0;
    const cashMultiplier = (1 + (a1 + a2 + a3)) * (1 + r);
    const speed = DECORATION_LEVELS[decorationLevel]?.speedBonus ?? 0;
    return {
      cashBonus: cashMultiplier - 1,
      speedBonus: speed,
      boostMultiplier: cashMultiplier * (1 + speed),
    };
  }, [race, artifact1, artifact2, artifact3, decorationLevel]);

  const valueLabel = cashBonus > 0.00005
    ? `Value (+${Number((cashBonus * 100).toFixed(4))}%)`
    : "Value";

  const roeLabel = (cashBonus + speedBonus) > 0.00005
    ? `Roe $/hr (+${Number(((cashBonus + speedBonus) * 100).toFixed(4))}%)`
    : "Roe $/hr";

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir(DEFAULT_DIR[key]);
    }
  };

  // Dynamically compute sell value for each entry
  const valueMap = React.useMemo(() => {
    return new Map(entries.map((e) => [e.id, computeEntryValue(e)]));
  }, [entries]);

  const rankMap = React.useMemo(() => {
    const sorted = [...entries].sort((a, b) => (valueMap.get(b.id) ?? 0) - (valueMap.get(a.id) ?? 0));
    return new Map(sorted.map((e, i) => [e.id, i + 1]));
  }, [entries, valueMap]);

  // Compute roe $/hr for each entry (boosted by race/artifact cash + decoration speed)
  const roeMap = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const entry of entries) {
      const fish = FISH_SPECIES.find((f) => f.name === entry.fishName.replace(/ \((Meat|Head)\)$/, ""));
      if (fish && fish.pondable !== false) {
        const hasMutation = entry.mutation !== "None";
        const base = calculateBaseRoePerHour(valueMap.get(entry.id) ?? 0, hasMutation, fish.rarity);
        map.set(entry.id, Math.round(base * boostMultiplier));
      } else {
        map.set(entry.id, 0);
      }
    }
    return map;
  }, [entries, valueMap, boostMultiplier]);

  const displayEntries = React.useMemo(() => {
    const mul = sortDir === "asc" ? 1 : -1;
    return [...entries].sort((a, b) => {
      switch (sortKey) {
        case "rank":
          return mul * ((rankMap.get(a.id) ?? 0) - (rankMap.get(b.id) ?? 0));
        case "fishName":
          return mul * a.fishName.localeCompare(b.fishName);
        case "weight":
          return mul * (a.weight - b.weight);
        case "stars":
          return mul * (a.stars - b.stars);
        case "mutation":
          return (
            mul *
            ((mutationMultiplierMap.get(a.mutation) ?? 1) -
              (mutationMultiplierMap.get(b.mutation) ?? 1))
          );
        case "value":
          return mul * ((valueMap.get(a.id) ?? 0) - (valueMap.get(b.id) ?? 0));
        case "roePerHour":
          return mul * ((roeMap.get(a.id) ?? 0) - (roeMap.get(b.id) ?? 0));
        case "createdAt":
          return (
            mul *
            (new Date(a.createdAt).getTime() -
              new Date(b.createdAt).getTime())
          );
        default:
          return 0;
      }
    });
  }, [entries, sortKey, sortDir, rankMap, valueMap]);

  const handleOcrResult = React.useCallback((result: OcrResult) => {
    const baseName = result.fishName ?? undefined;
    const fishName = baseName && result.dropType ? `${baseName} (${result.dropType})` : baseName;
    setOcrData({
      fishName,
      weight: result.weight ?? undefined,
      stars: result.stars ?? undefined,
      mutation: result.mutation ?? undefined,
    });
    setFormKey((k) => k + 1);
  }, []);

  const openAdd = () => {
    setEditingEntry(null);
    setOcrData(undefined);
    setFormKey((k) => k + 1);
    setModalOpen(true);
  };

  const openEdit = (entry: FishEntry) => {
    setEditingEntry(entry);
    setFormKey((k) => k + 1);
    setModalOpen(true);
  };

  const handleSubmit = async (formData: FishFormData) => {
    const data = {
      fishName: formData.fishName,
      weight: formData.weight,
      stars: formData.stars,
      mutation: formData.mutation,
    };

    if (editingEntry) {
      await onUpdate(editingEntry.id, data);
      addToast({
        variant: "success",
        title: "Entry Updated",
        description: `${formData.fishName} has been updated.`,
      });
    } else {
      const newEntry = await onAdd(data);
      const allSorted = [...entries, newEntry].sort(
        (a, b) => computeEntryValue(b) - computeEntryValue(a)
      );
      const pondFish = allSorted.slice(0, MAX_POND);

      if (pondFish.some((f) => f.id === newEntry.id)) {
        const replaced = allSorted[MAX_POND];
        if (replaced) {
          addToast({
            variant: "info",
            title: "Pond Updated!",
            description: `This fish replaces ${replaced.fishName} in your pond!`,
          });
        } else {
          addToast({
            variant: "success",
            title: "Added to Pond",
            description: `${formData.fishName} was added to your pond!`,
          });
        }
      } else {
        addToast({
          variant: "success",
          title: "Entry Added",
          description: `${formData.fishName} has been logged.`,
        });
      }
    }

    setModalOpen(false);
  };

  const handleDelete = (entry: FishEntry) => {
    onDelete(entry.id);
    let undone = false;
    const toastId = addToast({
      variant: "warning",
      title: "Entry Deleted",
      description: `${entry.fishName} has been removed.`,
      action: (
        <button
          onClick={() => {
            if (undone) return;
            undone = true;
            onRestore(entry);
            removeToast(toastId);
          }}
          className="text-xs font-semibold underline underline-offset-2 hover:opacity-80"
        >
          Undo
        </button>
      ),
    });
  };

  const allValues = React.useMemo(
    () => entries.map((e) => Math.round((valueMap.get(e.id) ?? 0) * (cashBonus + 1))),
    [entries, valueMap, cashBonus]
  );

  const sortProps = {
    activeSortKey: sortKey,
    sortDir,
    onSort: handleSort,
  };

  // Build active tab data: fish grouped by loadout, sorted by current sort
  const activeTabData = React.useMemo(() => {
    return pondSnapshots
      .filter((snap) => snap.fishIds.length > 0)
      .sort((a, b) => a.loadoutIndex - b.loadoutIndex)
      .map((snap) => {
        const idSet = new Set(snap.fishIds);
        return {
          snapshot: snap,
          name: getLoadoutName(snap.loadoutIndex, snap),
          fish: displayEntries.filter((e) => idSet.has(e.id)),
        };
      });
  }, [pondSnapshots, displayEntries]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">Fish Log</h2>
          <div className="flex gap-1 bg-secondary/50 p-1 rounded-lg">
            <button
              onClick={() => handleSubTabChange("active")}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${subTab === "active"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Active
            </button>
            <button
              onClick={() => handleSubTabChange("archive")}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${subTab === "archive"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Archive
            </button>
          </div>
        </div>
        <Button onClick={openAdd}>
          <IconPlus className="h-4 w-4 mr-2" />
          Add Entry
        </Button>
      </div>

      {/* Active subtab: fish grouped by loadout */}
      {subTab === "active" && (
        activeTabData.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No fish in any pond loadout yet. Go to the Fish Pond tab to set up your pond!
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {activeTabData.map(({ snapshot: snap, name, fish }) => (
              <Card key={snap.loadoutIndex}>
                <CardContent className="p-0">
                  <div className="px-4 py-3 border-b">
                    <h3 className="text-sm font-semibold">{name} ({fish.length}/{snap.pondSize})</h3>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <SortableHead label="Rank" sortKey="rank" className="w-16" {...sortProps} />
                        <SortableHead label="Fish" sortKey="fishName" {...sortProps} />
                        <SortableHead label="Weight" sortKey="weight" {...sortProps} />
                        <SortableHead label="Stars" sortKey="stars" {...sortProps} />
                        <SortableHead label="Mutation" sortKey="mutation" {...sortProps} />
                        <SortableHead label={valueLabel} sortKey="value" className="text-right" {...sortProps} />
                        <SortableHead label={roeLabel} sortKey="roePerHour" className="text-right" {...sortProps} />
                        <TableHead className="w-32">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fish.map((entry) => (
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
                          <TableCell className="text-right font-medium" style={{ color: getValueColor(Math.round((valueMap.get(entry.id) ?? 0) * (cashBonus + 1)), allValues) }}>
                            ${Math.round((valueMap.get(entry.id) ?? 0) * (cashBonus + 1)).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right font-medium" style={{ color: getValueColor(roeMap.get(entry.id) ?? 0, [...roeMap.values()]) }}>
                            ${(roeMap.get(entry.id) ?? 0).toLocaleString()}/hr
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  const baseValue = valueMap.get(entry.id) ?? 0;
                                  const fish = FISH_SPECIES.find((f) => f.name === entry.fishName.replace(/ \((Meat|Head)\)$/, ""));
                                  const hasMutation = entry.mutation !== "None";
                                  const baseRoe = fish && fish.pondable !== false
                                    ? calculateBaseRoePerHour(baseValue, hasMutation, fish.rarity)
                                    : null;
                                  navigator.clipboard.writeText(buildEntryDiscordText(entry, baseValue, baseRoe));
                                  setCopiedId(entry.id);
                                  setTimeout(() => setCopiedId(null), 2000);
                                }}
                              >
                                {copiedId === entry.id ? <IconCheck className="h-4 w-4" /> : <IconCopy className="h-4 w-4" />}
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => openEdit(entry)}>
                                <IconEdit className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(entry)}>
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
                                    {[2, 3, 4].map((i) => {
                                      const s = pondSnapshots.find((ps) => ps.loadoutIndex === i);
                                      const count = s?.fishIds.length ?? 0;
                                      const size = s?.pondSize ?? pondSnapshots[0]?.pondSize ?? 18;
                                      const isFull = count >= size;
                                      const alreadyIn = s?.fishIds.includes(entry.id) ?? false;
                                      return (
                                        <button
                                          key={i}
                                          disabled={isFull || alreadyIn}
                                          className="w-full text-left px-3 py-1.5 text-sm rounded hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                                          onClick={async () => {
                                            await onSendToPond(entry.id, i);
                                            setSendToPondId(null);
                                            addToast({
                                              variant: "success",
                                              title: "Added to Pond",
                                              description: `${entry.fishName} added to ${getLoadoutName(i, s)}.`,
                                            });
                                          }}
                                        >
                                          {getLoadoutName(i, s)} ({count}/{size})
                                          {alreadyIn && " (already in)"}
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
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      )}

      {/* Archive subtab: full fish log */}
      {subTab === "archive" && entries.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No fish logged yet. Add your first catch!
          </CardContent>
        </Card>
      ) : subTab === "archive" ? (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableHead label="Rank" sortKey="rank" className="w-16" {...sortProps} />
                  <SortableHead label="Fish" sortKey="fishName" {...sortProps} />
                  <SortableHead label="Weight" sortKey="weight" {...sortProps} />
                  <SortableHead label="Stars" sortKey="stars" {...sortProps} />
                  <SortableHead label="Mutation" sortKey="mutation" {...sortProps} />
                  <SortableHead label={valueLabel} sortKey="value" className="text-right" {...sortProps} />
                  <SortableHead label={roeLabel} sortKey="roePerHour" className="text-right" {...sortProps} />
                  <TableHead className="w-32">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayEntries.map((entry) => (
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
                    <TableCell className="text-right font-medium" style={{ color: getValueColor(Math.round((valueMap.get(entry.id) ?? 0) * (cashBonus + 1)), allValues) }}>
                      ${Math.round((valueMap.get(entry.id) ?? 0) * (cashBonus + 1)).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-medium" style={{ color: getValueColor(roeMap.get(entry.id) ?? 0, [...roeMap.values()]) }}>
                      ${(roeMap.get(entry.id) ?? 0).toLocaleString()}/hr
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            const baseValue = valueMap.get(entry.id) ?? 0;
                            const fish = FISH_SPECIES.find((f) => f.name === entry.fishName.replace(/ \((Meat|Head)\)$/, ""));
                            const hasMutation = entry.mutation !== "None";
                            const baseRoe = fish && fish.pondable !== false
                              ? calculateBaseRoePerHour(baseValue, hasMutation, fish.rarity)
                              : null;
                            navigator.clipboard.writeText(buildEntryDiscordText(entry, baseValue, baseRoe));
                            setCopiedId(entry.id);
                            setTimeout(() => setCopiedId(null), 2000);
                          }}
                        >
                          {copiedId === entry.id ? <IconCheck className="h-4 w-4" /> : <IconCopy className="h-4 w-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEdit(entry)}
                        >
                          <IconEdit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(entry)}
                        >
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
                              {[2, 3, 4].map((i) => {
                                const snap = pondSnapshots.find((s) => s.loadoutIndex === i);
                                const count = snap?.fishIds.length ?? 0;
                                const size = snap?.pondSize ?? pondSnapshots[0]?.pondSize ?? 18;
                                const isFull = count >= size;
                                const alreadyIn = snap?.fishIds.includes(entry.id) ?? false;
                                return (
                                  <button
                                    key={i}
                                    disabled={isFull || alreadyIn}
                                    className="w-full text-left px-3 py-1.5 text-sm rounded hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                                    onClick={async () => {
                                      await onSendToPond(entry.id, i);
                                      setSendToPondId(null);
                                      addToast({
                                        variant: "success",
                                        title: "Added to Pond",
                                        description: `${entry.fishName} added to ${getLoadoutName(i, snap)}.`,
                                      });
                                    }}
                                  >
                                    {getLoadoutName(i, snap)} ({count}/{size})
                                    {alreadyIn && " (already in)"}
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
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}

      {sendToPondId && <div className="fixed inset-0 z-40" onClick={() => setSendToPondId(null)} />}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {editingEntry ? "Edit Entry" : "Add Entry"}
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setModalOpen(false)}
              >
                <IconX className="h-4 w-4" />
              </Button>
            </div>
            {!editingEntry && <ImagePasteZone onResult={handleOcrResult} />}
            <FishForm
              key={formKey}
              settings={{ race, artifact1, artifact2, artifact3, roeStorageLevel, decorationLevel }}
              initialData={
                editingEntry
                  ? {
                    fishName: editingEntry.fishName,
                    weight: editingEntry.weight,
                    stars: editingEntry.stars,
                    mutation: editingEntry.mutation,
                  }
                  : ocrData
              }
              renderActions={(formData) => (
                <>
                  <Button
                    onClick={() => formData && handleSubmit(formData)}
                    disabled={!formData}
                  >
                    {editingEntry ? "Save Changes" : "Add to Log"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setModalOpen(false)}
                  >
                    Cancel
                  </Button>
                </>
              )}
            />
          </div>
        </div>
      )}
    </div>
  );
}
