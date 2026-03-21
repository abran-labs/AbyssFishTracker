"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FISH_SPECIES,
  CYCLE_TIMES,
  RARITY_COLORS,
  MUTATION_COLORS,
  getAvailableMutations,
} from "@/lib/fish-config";
import { calculateValue, calculateBaseRoePerHour } from "@/lib/fish-utils";
import { ArrowUpDown, ChevronDown, ChevronUp, Trophy, Crown, Star, ArrowUp, ArrowDown } from "lucide-react";

// ── Static constants ──

const RARITY_ORDER: Record<string, number> = {
  Common: 1, Uncommon: 2, Rare: 3, Epic: 4, Legendary: 5, Mythical: 6,
};

const AREA_COLORS: Record<string, string> = {
  "Ancient Sands": "rgb(255, 189, 123)",
  "Angler Cave": "rgb(113, 113, 113)",
  "Forgotten Deep": "rgb(115, 255, 162)",
  "Gloomspore Valley": "rgb(197, 151, 235)",
  "Ocean": "rgb(85, 170, 255)",
  "Spirit Roots": "rgb(158, 253, 255)",
  "Sunken Wilds": "rgb(179, 235, 149)",
};

// ── Static types ──

interface FishRanking {
  name: string;
  rarity: string;
  areas: string[];
  medianWeight: number;
  baseValue: number;
  noMutValue: number;
  noMutRoePerHour: number;
  noMutKgPerHour: number;
  bestMutation: string;
  bestMutValue: number;
  bestMutRoePerHour: number;
  effectiveRoePerHour: number;
  effectiveMutation: string;
}

interface MutationBreakdown {
  mutation: string;
  multiplier: number;
  value: number;
  roePerHour: number;
  percentVsNone: number;
}

// ── Gradient color helpers ──

// muted gray → warm gold (same as getValueColor in fish-config)
function goldGradient(value: number, min: number, max: number): string {
  const range = max - min;
  if (range === 0) return "rgb(241, 196, 65)";
  const t = (value - min) / range;
  const r = Math.round(130 + t * (241 - 130));
  const g = Math.round(130 + t * (196 - 130));
  const b = Math.round(145 + t * (65 - 145));
  return `rgb(${r}, ${g}, ${b})`;
}

// muted gray → red
function redGradient(value: number, min: number, max: number): string {
  const range = max - min;
  if (range === 0) return "rgb(220, 80, 80)";
  const t = (value - min) / range;
  const r = Math.round(130 + t * (220 - 130));
  const g = Math.round(130 + t * (80 - 130));
  const b = Math.round(145 + t * (80 - 145));
  return `rgb(${r}, ${g}, ${b})`;
}

// ── Precomputed at module load (build time) ──

function computeRankings(): FishRanking[] {
  const pondable = FISH_SPECIES.filter((f) => f.pondable !== false);

  return pondable.map((fish) => {
    const medianWeight = (fish.baseMinWeight + fish.baseMaxWeight) / 2;
    const starMult = 1.0;
    const cycleTime = CYCLE_TIMES[fish.rarity] ?? 600;

    const noMutValue = calculateValue(medianWeight, fish.baseValue, starMult, 1.0, 1.0);
    const noMutRoe = calculateBaseRoePerHour(noMutValue, false, fish.rarity);
    const noMutKgPerHour = medianWeight * 0.02 * (3600 / cycleTime);

    const available = getAvailableMutations(fish);
    let bestMut = "None";
    let bestMutVal = noMutValue;
    let bestMutRoe = noMutRoe;

    for (const mut of available) {
      if (mut.name === "None") continue;
      const mutWeight = medianWeight * mut.sizeMultiplier;
      const mutVal = calculateValue(mutWeight, fish.baseValue, starMult, mut.multiplier, mut.sizeMultiplier);
      const mutRoe = calculateBaseRoePerHour(mutVal, true, fish.rarity);
      if (mutRoe > bestMutRoe) {
        bestMut = mut.name;
        bestMutVal = mutVal;
        bestMutRoe = mutRoe;
      }
    }

    const effectiveRoe = Math.max(noMutRoe, bestMutRoe);
    const effectiveMut = bestMutRoe > noMutRoe ? bestMut : "None";

    return {
      name: fish.name,
      rarity: fish.rarity,
      areas: fish.areas,
      medianWeight: Math.round(medianWeight * 10) / 10,
      baseValue: fish.baseValue,
      noMutValue: Math.round(noMutValue),
      noMutRoePerHour: noMutRoe,
      noMutKgPerHour: Math.round(noMutKgPerHour * 10) / 10,
      bestMutation: bestMut,
      bestMutValue: Math.round(bestMutVal),
      bestMutRoePerHour: bestMutRoe,
      effectiveRoePerHour: effectiveRoe,
      effectiveMutation: effectiveMut,
    };
  });
}

function computeMutationBreakdowns(): Record<string, MutationBreakdown[]> {
  const pondable = FISH_SPECIES.filter((f) => f.pondable !== false);
  const result: Record<string, MutationBreakdown[]> = {};

  for (const fish of pondable) {
    const medianWeight = (fish.baseMinWeight + fish.baseMaxWeight) / 2;
    const available = getAvailableMutations(fish);

    const noneVal = calculateValue(medianWeight, fish.baseValue, 1.0, 1.0, 1.0);
    const noneRoe = calculateBaseRoePerHour(noneVal, false, fish.rarity);

    result[fish.name] = available
      .map((mut) => {
        const w = medianWeight * mut.sizeMultiplier;
        const val = calculateValue(w, fish.baseValue, 1.0, mut.multiplier, mut.sizeMultiplier);
        const hasMut = mut.name !== "None";
        const roe = calculateBaseRoePerHour(val, hasMut, fish.rarity);
        const percentVsNone = noneRoe > 0 ? ((roe - noneRoe) / noneRoe) * 100 : 0;
        return {
          mutation: mut.name,
          multiplier: mut.multiplier,
          value: Math.round(val),
          roePerHour: roe,
          percentVsNone: Math.round(percentVsNone),
        };
      })
      .sort((a, b) => b.roePerHour - a.roePerHour);
  }

  return result;
}

// ── Developer-controlled notice ──
// Set GUIDE_NOTICE to null to hide, or a JSX element to show.
const GUIDE_NOTICE: React.ReactNode = (
  <>
    While{" "}
    <span style={{ color: RARITY_COLORS["Mythical"] }}>Angel</span>{" "}
    is ranked #1, it is incredibly difficult to catch a 3-star{" "}
    <span style={{ color: RARITY_COLORS["Mythical"] }}>Angel</span>.
    {" "}In most cases,{" "}
    <span style={{ color: RARITY_COLORS["Epic"] }}>Basking Shark</span>{" "}
    is the better option.
    <br />
    {" "}Additionally, while{" "}
    <span style={{ color: RARITY_COLORS["Epic"] }}>Basking Shark</span>{" "}
    out-earns{" "}
    <span style={{ color: RARITY_COLORS["Epic"] }}>Alien</span>,{" "}
    it does fill your storage more than twice as fast.
  </>
);

const RANKINGS = computeRankings();
const MUTATION_BREAKDOWNS = computeMutationBreakdowns();

const RANK_MAP = (() => {
  const byRoe = [...RANKINGS].sort((a, b) => b.effectiveRoePerHour - a.effectiveRoePerHour);
  const map = new Map<string, number>();
  byRoe.forEach((r, i) => map.set(r.name, i + 1));
  return map;
})();

const TOP_BY_RARITY = (["Mythical", "Legendary", "Epic", "Rare", "Uncommon", "Common"] as const)
  .map((rarity) => {
    const best = RANKINGS
      .filter((r) => r.rarity === rarity)
      .sort((a, b) => b.noMutRoePerHour - a.noMutRoePerHour)[0];
    return best ? { rarity, fish: best } : null;
  })
  .filter(Boolean) as { rarity: string; fish: FishRanking }[];

// Precompute min/max for gradient coloring
const ALL_NO_MUT_ROE = RANKINGS.map((r) => r.noMutRoePerHour);
const NO_MUT_ROE_MIN = Math.min(...ALL_NO_MUT_ROE);
const NO_MUT_ROE_MAX = Math.max(...ALL_NO_MUT_ROE);

const ALL_KG_PER_HOUR = RANKINGS.map((r) => r.noMutKgPerHour);
const KG_PER_HOUR_MIN = Math.min(...ALL_KG_PER_HOUR);
const KG_PER_HOUR_MAX = Math.max(...ALL_KG_PER_HOUR);

// ── UI Components ──

type SortKey = "rank" | "name" | "rarity" | "noMutRoe" | "kgPerHour" | "effectiveRoe";
type SortDir = "asc" | "desc";

function MutationBadge({ mutation }: { mutation: string }) {
  if (mutation === "None") {
    const color = "rgb(200, 200, 200)";
    return (
      <span
        className="inline-block px-1.5 py-0.5 rounded text-xs font-medium"
        style={{
          color,
          backgroundColor: `${color}18`,
          border: `1px solid ${color}40`,
        }}
      >
        None
      </span>
    );
  }
  const color = MUTATION_COLORS[mutation] ?? "rgb(160,160,160)";
  return (
    <span
      className="inline-block px-1.5 py-0.5 rounded text-xs font-medium"
      style={{
        color,
        backgroundColor: `${color}18`,
        border: `1px solid ${color}40`,
      }}
    >
      {mutation}
    </span>
  );
}

function RarityBadge({ rarity }: { rarity: string }) {
  return (
    <span
      className="inline-block px-1.5 py-0.5 rounded text-xs font-medium"
      style={{
        color: RARITY_COLORS[rarity],
        backgroundColor: `${RARITY_COLORS[rarity]}18`,
        border: `1px solid ${RARITY_COLORS[rarity]}40`,
      }}
    >
      {rarity}
    </span>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <span className="inline-flex items-center gap-0.5 text-sm font-bold" style={{ color: "rgb(241, 196, 65)" }}>
        <Crown className="w-4 h-4" /> 1
      </span>
    );
  }
  if (rank === 2) {
    return (
      <span className="inline-flex items-center gap-0.5 text-sm font-bold" style={{ color: "rgb(186, 192, 200)" }}>
        <Trophy className="w-3.5 h-3.5" /> 2
      </span>
    );
  }
  if (rank === 3) {
    return (
      <span className="inline-flex items-center gap-0.5 text-sm font-bold" style={{ color: "rgb(205, 153, 96)" }}>
        <Trophy className="w-3.5 h-3.5" /> 3
      </span>
    );
  }
  return <span className="text-sm text-muted-foreground">#{rank}</span>;
}

function AreaLabel({ areas }: { areas: string[] }) {
  return (
    <>
      {areas.map((area, i) => (
        <React.Fragment key={area}>
          {i > 0 && <span className="text-muted-foreground">, </span>}
          <span style={{ color: AREA_COLORS[area] ?? undefined }}>{area}</span>
        </React.Fragment>
      ))}
    </>
  );
}

function SortButton({
  label,
  sortKey,
  currentSort,
  currentDir,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  currentSort: SortKey;
  currentDir: SortDir;
  onSort: (key: SortKey) => void;
}) {
  const active = currentSort === sortKey;
  return (
    <button
      className="inline-flex items-center gap-0.5 hover:text-foreground transition-colors text-left"
      onClick={() => onSort(sortKey)}
    >
      <span className={active ? "text-foreground font-medium" : ""}>{label}</span>
      {active ? (
        currentDir === "desc" ? (
          <ChevronDown className="w-3 h-3" />
        ) : (
          <ChevronUp className="w-3 h-3" />
        )
      ) : (
        <ArrowUpDown className="w-3 h-3 opacity-40" />
      )}
    </button>
  );
}

// ── Main Component ──

export function GuideTab() {
  const [sortKey, setSortKey] = React.useState<SortKey>("effectiveRoe");
  const [sortDir, setSortDir] = React.useState<SortDir>("desc");
  const [filterRarity, setFilterRarity] = React.useState<string>("all");
  const [expandedFish, setExpandedFish] = React.useState<string | null>(null);

  const handleSort = React.useCallback(
    (key: SortKey) => {
      if (sortKey === key) {
        setSortDir((d) => (d === "desc" ? "asc" : "desc"));
      } else {
        setSortKey(key);
        setSortDir(key === "name" ? "asc" : "desc");
      }
    },
    [sortKey]
  );

  const sorted = React.useMemo(() => {
    let items = [...RANKINGS];
    if (filterRarity !== "all") {
      items = items.filter((r) => r.rarity === filterRarity);
    }
    items.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "rarity":
          cmp = RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity];
          break;
        case "noMutRoe":
          cmp = a.noMutRoePerHour - b.noMutRoePerHour;
          break;
        case "kgPerHour":
          cmp = a.noMutKgPerHour - b.noMutKgPerHour;
          break;
        case "effectiveRoe":
        case "rank":
          cmp = a.effectiveRoePerHour - b.effectiveRoePerHour;
          break;
      }
      return sortDir === "desc" ? -cmp : cmp;
    });
    return items;
  }, [filterRarity, sortKey, sortDir]);

  const expandedData = expandedFish ? MUTATION_BREAKDOWNS[expandedFish] ?? null : null;

  return (
    <div className="space-y-4">
      {/* Developer notice */}
      {GUIDE_NOTICE && (
        <div
          className="rounded-lg border px-4 py-3 text-sm"
          style={{
            borderColor: "rgba(85, 170, 255, 0.4)",
            backgroundColor: "rgba(85, 170, 255, 0.07)",
            color: "rgb(220, 220, 220)",
          }}
        >
          <span className="font-semibold mr-1.5" style={{ color: "rgb(85, 170, 255)" }}>Notice:</span>
          {GUIDE_NOTICE}
        </div>
      )}
      {/* Top Picks Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5" style={{ color: "rgb(241, 196, 65)" }} />
            Best Fish by Rarity
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Ranked by base roe $/hr | median weight | 3 stars | no boosts
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {TOP_BY_RARITY.map(({ rarity, fish }) => {
              const rank = RANK_MAP.get(fish.name) ?? 0;
              const rarityColor = RARITY_COLORS[rarity];
              return (
                <div
                  key={rarity}
                  className="rounded-lg border p-3 space-y-1"
                  style={{
                    borderColor: rarityColor,
                    backgroundColor: rarityColor.replace("rgb(", "rgba(").replace(")", ", 0.12)"),
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium" style={{ color: rarityColor }}>{fish.name}</span>
                    <RankBadge rank={rank} />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{fish.medianWeight}kg</span>
                    <span className="font-mono font-semibold" style={{ color: "rgb(135, 203, 116)" }}>
                      ${fish.noMutRoePerHour.toLocaleString()}/hr
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Full Rankings Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>All Fish Rankings</CardTitle>
          <p className="text-sm text-muted-foreground">
            Ranked by base roe $/hr | median weight | 3 stars | no boosts
            <br />
            Click a fish to see mutation breakdown.
          </p>
        </CardHeader>
        <CardContent>
          {/* Rarity filter */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            <Button
              variant={filterRarity === "all" ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setFilterRarity("all")}
            >
              All
            </Button>
            {["Common", "Uncommon", "Rare", "Epic", "Legendary", "Mythical"].map((r) => (
              <Button
                key={r}
                variant={filterRarity === r ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setFilterRarity(r)}
                style={
                  filterRarity === r
                    ? { backgroundColor: RARITY_COLORS[r], borderColor: RARITY_COLORS[r], color: "#fff" }
                    : { color: RARITY_COLORS[r], borderColor: `${RARITY_COLORS[r]}60` }
                }
              >
                {r}
              </Button>
            ))}
          </div>

          {/* Table */}
          <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="text-left py-2 pr-2 w-8">
                    <SortButton label="#" sortKey="rank" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                  </th>
                  <th className="text-left py-2 pr-3">
                    <SortButton label="Fish" sortKey="name" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                  </th>
                  <th className="text-left py-2 pr-3 hidden sm:table-cell">
                    <SortButton label="Rarity" sortKey="rarity" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                  </th>
                  <th className="text-right py-2 pr-3">
                    <SortButton label="No Mut $/hr" sortKey="noMutRoe" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                  </th>
                  <th className="text-right py-2 pr-3 hidden md:table-cell">
                    <SortButton label="kg/hr" sortKey="kgPerHour" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                  </th>
                  <th className="text-right py-2">
                    <SortButton label="Best $/hr" sortKey="effectiveRoe" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                  </th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((fish) => {
                  const rank = RANK_MAP.get(fish.name) ?? 0;
                  const isExpanded = expandedFish === fish.name;
                  return (
                    <React.Fragment key={fish.name}>
                      <tr
                        className="border-b border-border/40 hover:bg-muted/30 cursor-pointer transition-colors"
                        onClick={() => setExpandedFish(isExpanded ? null : fish.name)}
                      >
                        <td className="py-2 pr-2">
                          <RankBadge rank={rank} />
                        </td>
                        <td className="py-2 pr-3">
                          <div className="font-medium" style={{ color: RARITY_COLORS[fish.rarity] }}>{fish.name}</div>
                          <div className="text-xs text-muted-foreground sm:hidden">
                            <RarityBadge rarity={fish.rarity} />
                          </div>
                          <div className="text-xs">
                            <span className="text-muted-foreground">{fish.medianWeight}kg</span>
                            <span className="text-muted-foreground"> &middot; </span>
                            <AreaLabel areas={fish.areas} />
                          </div>
                        </td>
                        <td className="py-2 pr-3 hidden sm:table-cell">
                          <RarityBadge rarity={fish.rarity} />
                        </td>
                        <td className="py-2 pr-3 text-right font-mono" style={{
                          color: goldGradient(fish.noMutRoePerHour, NO_MUT_ROE_MIN, NO_MUT_ROE_MAX),
                        }}>
                          ${fish.noMutRoePerHour.toLocaleString()}
                        </td>
                        <td className="py-2 pr-3 text-right font-mono hidden md:table-cell" style={{
                          color: redGradient(fish.noMutKgPerHour, KG_PER_HOUR_MIN, KG_PER_HOUR_MAX),
                        }}>
                          {fish.noMutKgPerHour}
                        </td>
                        <td className="py-2 text-right">
                          <span className="font-mono font-semibold" style={{ color: "rgb(135, 203, 116)" }}>
                            ${fish.effectiveRoePerHour.toLocaleString()}
                          </span>
                          {fish.effectiveMutation !== "None" && (
                            <div className="mt-0.5">
                              <MutationBadge mutation={fish.effectiveMutation} />
                            </div>
                          )}
                        </td>
                      </tr>
                      {isExpanded && expandedData && (
                        <tr className="bg-muted/20">
                          <td colSpan={6} className="py-3 px-4">
                            <MutationBreakdownPanel
                              data={expandedData}
                              fishName={fish.name}
                              medianWeight={fish.medianWeight}
                            />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Mutation Breakdown Panel ──

function MutationBreakdownPanel({
  data,
  fishName,
  medianWeight,
}: {
  data: MutationBreakdown[];
  fishName: string;
  medianWeight: number;
}) {
  return (
    <div className="rounded-lg border border-border/40 bg-muted/10 p-3 mt-1.5">
      <div className="text-xs font-medium text-muted-foreground mb-2">
        All mutations for {fishName} (median {medianWeight}kg, 3 stars)
      </div>
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-1.5">
        {data.map((m) => {
          const isNone = m.mutation === "None";
          const isPositive = m.percentVsNone > 0;
          return (
            <div
              key={m.mutation}
              className="flex items-center justify-between rounded px-2 py-1 text-xs break-inside-avoid mb-1"
              style={{
                backgroundColor: isNone
                  ? "rgba(220, 220, 220, 0.15)"
                  : "rgba(255, 255, 255, 0.03)",
                border: isNone
                  ? "1px solid rgba(220, 220, 220, 0.35)"
                  : "1px solid rgba(255, 255, 255, 0.06)",
              }}
            >
              <div className="flex items-center gap-1.5">
                {!isNone && (
                  <span className="flex items-center gap-0.5 w-14 shrink-0 font-mono" style={{
                    color: isPositive ? "rgb(135, 203, 116)" : "rgb(220, 80, 80)",
                    fontSize: "10px",
                  }}>
                    {isPositive ? (
                      <ArrowUp className="w-3 h-3 shrink-0" />
                    ) : (
                      <ArrowDown className="w-3 h-3 shrink-0" />
                    )}
                    {isPositive ? "+" : ""}{m.percentVsNone}%
                  </span>
                )}
                {isNone && <span className="w-14 shrink-0" />}
                <MutationBadge mutation={m.mutation} />
                <span className="text-muted-foreground">
                  ${m.value.toLocaleString()}
                </span>
              </div>
              <span className="font-mono font-medium ml-2">
                ${m.roePerHour.toLocaleString()}/hr
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
