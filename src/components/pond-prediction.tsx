"use client";

import * as React from "react";
import { useSettings } from "@/components/settings-context";
import { type FishEntry } from "@/lib/types";
import { FISH_SPECIES, FISH_FEED, ROE_STORAGE_LEVELS, DECORATION_LEVELS, RACES, ARTIFACTS, CYCLE_TIMES } from "@/lib/fish-config";
import { calculateBaseRoePerHour, calculateBoostedRoePerHour } from "@/lib/fish-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { IconBell } from "@tabler/icons-react";

interface PondPredictionProps {
    pondFish: FishEntry[];
}

export function PondPrediction({ pondFish }: PondPredictionProps) {
    const settings = useSettings();
    const [feedType, setFeedType] = React.useState("None");
    const [feedBags, setFeedBags] = React.useState("1");
    const [isOffline, setIsOffline] = React.useState(true);
    const [notifFeedScheduled, setNotifFeedScheduled] = React.useState(false);
    const [notifStorageScheduled, setNotifStorageScheduled] = React.useState(false);
    const notifFeedTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const notifStorageTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    const cancelNotifs = () => {
        if (notifFeedTimer.current) { clearTimeout(notifFeedTimer.current); notifFeedTimer.current = null; }
        if (notifStorageTimer.current) { clearTimeout(notifStorageTimer.current); notifStorageTimer.current = null; }
        setNotifFeedScheduled(false);
        setNotifStorageScheduled(false);
    };

    // Cancel scheduled notifications and reset state when inputs change
    const handleFeedTypeChange = (v: string) => { setFeedType(v); cancelNotifs(); };
    const handleFeedBagsChange = (v: string) => { setFeedBags(v); cancelNotifs(); };
    const handleModeChange = (offline: boolean) => { setIsOffline(offline); cancelNotifs(); };

    const selectedFeed = FISH_FEED.find((f) => f.name === feedType) ?? FISH_FEED[0];
    const storageCapacity = ROE_STORAGE_LEVELS[settings.roeStorageLevel]?.capacity ?? 500;

    const globalSettings = React.useMemo(() => ({
        race: settings.race,
        artifact1: settings.artifact1,
        artifact2: settings.artifact2,
        artifact3: settings.artifact3,
    }), [settings.race, settings.artifact1, settings.artifact2, settings.artifact3]);

    // Cash multiplier (race + artifacts) — affects roe VALUE at collection, not fill speed
    const cashMultiplier = React.useMemo(() => {
        const r = RACES.find((r) => r.name === settings.race)?.cashBonus ?? 0;
        const a1 = ARTIFACTS.find((a) => a.name === settings.artifact1)?.cashBonus ?? 0;
        const a2 = ARTIFACTS.find((a) => a.name === settings.artifact2)?.cashBonus ?? 0;
        const a3 = ARTIFACTS.find((a) => a.name === settings.artifact3)?.cashBonus ?? 0;
        return (1 + (a1 + a2 + a3)) * (1 + r);
    }, [settings.race, settings.artifact1, settings.artifact2, settings.artifact3]);

    // Income rate $/hr (speed + cash + offline) — shown to user
    const totalRoePerHour = React.useMemo(() => {
        let total = 0;
        for (const entry of pondFish) {
            const fish = FISH_SPECIES.find((f) => f.name === entry.fishName);
            if (!fish) continue;
            const hasMutation = entry.mutation !== "None";
            const baseRoe = calculateBaseRoePerHour(entry.value, hasMutation, fish.rarity);
            total += calculateBoostedRoePerHour(baseRoe, globalSettings, settings.decorationLevel, selectedFeed.speedBonus, isOffline);
        }
        return total;
    }, [pondFish, globalSettings, settings.decorationLevel, selectedFeed.speedBonus, isOffline]);

    // Physical roe fill rate kg/hr (speed + offline, NO cash) — used for time until full
    // Uses fishWeight × 0.02 × (3600 / cycleTime) per the game formula
    const roeKgPerHour = React.useMemo(() => {
        let total = 0;
        for (const entry of pondFish) {
            const fish = FISH_SPECIES.find((f) => f.name === entry.fishName);
            if (!fish) continue;
            const cycleTime = CYCLE_TIMES[fish.rarity] ?? 600;
            const decoBonus = DECORATION_LEVELS[settings.decorationLevel]?.speedBonus ?? 0;
            const speedMult = 1 + decoBonus + selectedFeed.speedBonus;
            const offlineMult = isOffline ? 0.5 : 1.0;
            total += entry.weight * 0.02 * (3600 / cycleTime) * speedMult * offlineMult;
        }
        return total;
    }, [pondFish, settings.decorationLevel, selectedFeed.speedBonus, isOffline]);

    const feedDurationHours = selectedFeed.durationMinutes > 0
        ? (selectedFeed.durationMinutes * parseInt(feedBags || "1", 10)) / 60
        : Infinity;

    // Time until storage fills = physical kg capacity / physical fill rate
    const hoursUntilFull = roeKgPerHour > 0 ? storageCapacity / roeKgPerHour : Infinity;

    // Full storage value = total roe $/hr × time to fill storage
    const fullStorageValue = isFinite(hoursUntilFull) && hoursUntilFull > 0
        ? Math.round(totalRoePerHour * hoursUntilFull)
        : 0;

    // Smarter fill time accounting for feed expiry mid-fill:
    // During feed: fills at roeKgPerHour (includes feed speed).
    // After feed expires: fills at the no-feed rate.
    const roeKgNoFeed = React.useMemo(() => {
        let total = 0;
        for (const entry of pondFish) {
            const fish = FISH_SPECIES.find((f) => f.name === entry.fishName);
            if (!fish) continue;
            const cycleTime = CYCLE_TIMES[fish.rarity] ?? 600;
            const decoBonus = DECORATION_LEVELS[settings.decorationLevel]?.speedBonus ?? 0;
            const offlineMult = isOffline ? 0.5 : 1.0;
            total += entry.weight * 0.02 * (3600 / cycleTime) * (1 + decoBonus) * offlineMult;
        }
        return total;
    }, [pondFish, settings.decorationLevel, isOffline]);

    const hoursUntilFullWithFeed = React.useMemo(() => {
        if (feedDurationHours === Infinity || roeKgPerHour <= 0) return hoursUntilFull;
        const kgDuringFeed = roeKgPerHour * feedDurationHours;
        if (kgDuringFeed >= storageCapacity) {
            // Fills before or exactly when feed expires
            return storageCapacity / roeKgPerHour;
        }
        const remaining = storageCapacity - kgDuringFeed;
        return roeKgNoFeed > 0
            ? feedDurationHours + remaining / roeKgNoFeed
            : Infinity;
    }, [feedDurationHours, roeKgPerHour, roeKgNoFeed, storageCapacity, hoursUntilFull]);

    const formatTime = (hours: number) => {
        if (!isFinite(hours) || hours <= 0) return "—";
        if (hours < 1) return `${Math.round(hours * 60)}m`;
        const h = Math.floor(hours);
        const m = Math.round((hours - h) * 60);
        return m > 0 ? `${h}h ${m}m` : `${h}h`;
    };

    const toClockTime = (hours: number) => {
        if (!isFinite(hours) || hours <= 0) return null;
        const d = new Date(Date.now() + hours * 3600_000);
        return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    };

    const scheduleNotification = (
        hours: number,
        body: string,
        timerRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>,
        onScheduled: () => void
    ) => {
        if (!("Notification" in window)) return;
        Notification.requestPermission().then((perm) => {
            if (perm === "granted" && isFinite(hours) && hours > 0) {
                if (timerRef.current) clearTimeout(timerRef.current);
                timerRef.current = setTimeout(() => new Notification("Abyss Fish Tracker", { body }), hours * 3600_000);
                onScheduled();
            }
        });
    };

    if (pondFish.length === 0) return null;

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-base">Pond Calculator</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                        <Label className="text-xs">Fish Feed</Label>
                        <Select value={feedType} onValueChange={handleFeedTypeChange}>
                            <SelectTrigger className="h-8 text-xs" style={selectedFeed.color ? { color: selectedFeed.color } : undefined}>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {FISH_FEED.map((f) => (
                                    <SelectItem key={f.name} value={f.name} style={f.color ? { color: f.color } : undefined}>
                                        {f.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs"># of Feed Bags</Label>
                        <Input
                            type="number"
                            min="1"
                            value={feedBags}
                            onChange={(e) => handleFeedBagsChange(e.target.value)}
                            className="h-8 text-xs"
                            disabled={feedType === "None"}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label className="text-xs">Mode</Label>
                        <div className="flex gap-1">
                            <Button
                                variant="outline"
                                size="sm"
                                className={`flex-1 h-8 text-xs transition-colors ${isOffline ? "bg-red-500/20 border-red-500/60 text-red-400 hover:bg-red-500/30" : "text-muted-foreground"}`}
                                onClick={() => handleModeChange(true)}
                            >
                                Offline
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className={`flex-1 h-8 text-xs transition-colors ${!isOffline ? "bg-green-500/20 border-green-500/60 text-green-400 hover:bg-green-500/30" : "text-muted-foreground"}`}
                                onClick={() => handleModeChange(false)}
                            >
                                Online
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Always-visible stats */}
                <div className="rounded-md border bg-secondary/30 p-4 space-y-2">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Total Roe $/hr</span>
                            <span className="font-semibold">${Math.round(totalRoePerHour).toLocaleString()}/hr</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Total Roe $/day</span>
                            <span className="font-semibold">${Math.round(totalRoePerHour * 24).toLocaleString()}/day</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Time Until Full</span>
                            <span className="font-semibold">{formatTime(hoursUntilFull)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Full Storage Value</span>
                            <span className="font-semibold">${fullStorageValue.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Timing rows with notification bells */}
                <div className="rounded-md border border-amber-500/30 bg-amber-500/5 px-4 py-3 space-y-2 text-sm">
                    {feedType !== "None" && isFinite(feedDurationHours) && (
                        <div className="flex items-center justify-between gap-2">
                            <span className="text-muted-foreground">Feed expires in</span>
                            <div className="flex items-center gap-2 ml-auto">
                                <span className="font-semibold">{formatTime(feedDurationHours)}</span>
                                {"Notification" in (typeof window !== "undefined" ? window : {}) && (
                                    <Button variant="ghost" size="sm" className="h-6 text-xs gap-1 px-2"
                                        onClick={() => scheduleNotification(feedDurationHours, "Your fish feed has expired!", notifFeedTimer, () => setNotifFeedScheduled(true))}
                                        disabled={notifFeedScheduled}
                                    >
                                        <IconBell className="h-3 w-3" />
                                        {notifFeedScheduled ? "Set" : "Remind Me"}
                                    </Button>
                                )}
                            </div>
                        </div>
                    )}
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground">Storage full in</span>
                        <div className="flex items-center gap-2 ml-auto">
                            <span className="font-semibold">{formatTime(hoursUntilFullWithFeed)}</span>
                            {isFinite(hoursUntilFullWithFeed) && "Notification" in (typeof window !== "undefined" ? window : {}) && (
                                <Button variant="ghost" size="sm" className="h-6 text-xs gap-1 px-2"
                                    onClick={() => scheduleNotification(hoursUntilFullWithFeed, "Your roe storage is full!", notifStorageTimer, () => setNotifStorageScheduled(true))}
                                    disabled={notifStorageScheduled}
                                >
                                    <IconBell className="h-3 w-3" />
                                    {notifStorageScheduled ? "Set" : "Remind Me"}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
