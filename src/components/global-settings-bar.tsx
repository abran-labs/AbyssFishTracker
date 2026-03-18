"use client";

import * as React from "react";
import { useSettings } from "@/components/settings-context";
import { RACES, ARTIFACTS } from "@/lib/fish-config";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const COIN_TIERS = ["I", "II", "III", "IV", "V", "VI", "VII"];
const KINGS_COLOR = "rgb(129, 184, 164)";

function getCoinColor(tier: string): string {
    const artifact = ARTIFACTS.find((a) => a.name === `Coin Tier ${tier}`);
    return artifact?.color ?? "inherit";
}

function ArtifactSlot({
    value,
    onChange,
    kingsFortuneUsed,
}: {
    value: string;
    onChange: (val: string) => void;
    kingsFortuneUsed: boolean;
}) {
    const isCoins = value.startsWith("Coin Tier ");
    const baseType = isCoins ? "Coins" : value;
    const currentTier = isCoins ? value.replace("Coin Tier ", "") : "I";

    const triggerColor = baseType === "The King's Fortune" ? KINGS_COLOR
        : isCoins ? getCoinColor(currentTier)
        : undefined;

    return (
        <div className="flex items-center gap-1">
            <Select
                value={baseType}
                onValueChange={(v) => onChange(v === "Coins" ? "Coin Tier I" : v)}
            >
                <SelectTrigger className="h-7 text-xs w-[120px]" style={triggerColor ? { color: triggerColor } : undefined}>
                    <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="None">None</SelectItem>
                    <SelectItem
                        value="The King's Fortune"
                        disabled={kingsFortuneUsed && baseType !== "The King's Fortune"}
                        style={{ color: KINGS_COLOR }}
                    >
                        King&apos;s Fortune
                    </SelectItem>
                    <SelectItem value="Coins">Coins</SelectItem>
                </SelectContent>
            </Select>

            {isCoins && (
                <Select
                    value={currentTier}
                    onValueChange={(t) => onChange(`Coin Tier ${t}`)}
                >
                    <SelectTrigger className="h-7 text-xs w-[52px]" style={{ color: getCoinColor(currentTier) }}>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {COIN_TIERS.map((t) => (
                            <SelectItem key={t} value={t} style={{ color: getCoinColor(t) }}>{t}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )}
        </div>
    );
}

export function GlobalSettingsBar() {
    const { race, artifact1, artifact2, artifact3, updateSettings } = useSettings();

    const totalBonus = React.useMemo(() => {
        const r = RACES.find(r => r.name === race)?.cashBonus || 0;
        const a1 = ARTIFACTS.find(a => a.name === artifact1)?.cashBonus || 0;
        const a2 = ARTIFACTS.find(a => a.name === artifact2)?.cashBonus || 0;
        const a3 = ARTIFACTS.find(a => a.name === artifact3)?.cashBonus || 0;
        return r + a1 + a2 + a3;
    }, [race, artifact1, artifact2, artifact3]);

    const kingsFortuneUsed =
        artifact1 === "The King's Fortune" ||
        artifact2 === "The King's Fortune" ||
        artifact3 === "The King's Fortune";

    const raceColor = RACES.find(r => r.name === race)?.color;

    return (
        <div className="flex items-center gap-3 flex-wrap text-xs">
            {/* Race */}
            <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground font-medium shrink-0">Race</span>
                <Select value={race} onValueChange={(v) => updateSettings({ race: v })}>
                    <SelectTrigger className="h-7 text-xs w-[110px]" style={raceColor ? { color: raceColor } : undefined}>
                        <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                        {RACES.map((r) => (
                            <SelectItem key={r.name} value={r.name} style={r.color ? { color: r.color } : undefined}>
                                {r.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <span className="text-border/60 shrink-0">·</span>

            {/* Artifacts */}
            <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-muted-foreground font-medium shrink-0">Artifacts</span>
                <ArtifactSlot
                    value={artifact1}
                    onChange={(v) => updateSettings({ artifact1: v })}
                    kingsFortuneUsed={kingsFortuneUsed}
                />
                <ArtifactSlot
                    value={artifact2}
                    onChange={(v) => updateSettings({ artifact2: v })}
                    kingsFortuneUsed={kingsFortuneUsed}
                />
                <ArtifactSlot
                    value={artifact3}
                    onChange={(v) => updateSettings({ artifact3: v })}
                    kingsFortuneUsed={kingsFortuneUsed}
                />
            </div>

            {totalBonus > 0 && (
                <>
                    <span className="text-border/60 shrink-0">·</span>
                    <span className="font-semibold text-amber-400 tabular-nums shrink-0">
                        +{(totalBonus * 100).toFixed(1)}%
                    </span>
                </>
            )}
        </div>
    );
}
