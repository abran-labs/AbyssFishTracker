"use client";

import * as React from "react";
import { useSettings } from "@/components/settings-context";
import { type FishEntry, type FishArea } from "@/lib/types";
import { FISH_SPECIES, FISH_FEED, ROE_STORAGE_LEVELS, DECORATION_LEVELS, RACES, ARTIFACTS, CYCLE_TIMES, MUTATIONS, POND_SIZES } from "@/lib/fish-config";
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
import { IconBell, IconBellOff } from "@tabler/icons-react";

// Computed once at module load from static config — no user settings involved
const THEORETICAL_MAX_ROE_PER_HOUR = (() => {
    // Best race: highest cash bonus
    const bestRaceCashBonus = Math.max(...RACES.map((r) => r.cashBonus));

    // Best 3 artifact slots: sort by cashBonus desc, unique artifacts only once
    const sortedArtifacts = [...ARTIFACTS].sort((a, b) => b.cashBonus - a.cashBonus);
    const usedUnique = new Set<string>();
    let bestArtifactBonus = 0;
    let slots = 0;
    for (const art of sortedArtifacts) {
        if (slots >= 3) break;
        if (art.unique && usedUnique.has(art.name)) continue;
        if (art.unique) usedUnique.add(art.name);
        bestArtifactBonus += art.cashBonus;
        slots++;
    }
    const bestCashMultiplier = (1 + bestArtifactBonus) * (1 + bestRaceCashBonus);

    // Best feed speed bonus
    const bestFeedSpeedBonus = Math.max(...FISH_FEED.map((f) => f.speedBonus));
    // Best decoration speed bonus
    const bestDecoSpeedBonus = Math.max(...DECORATION_LEVELS.map((d) => d.speedBonus));
    const bestSpeedMultiplier = 1 + bestDecoSpeedBonus + bestFeedSpeedBonus;
    // Online = 1.0 multiplier (no offline penalty)

    // Find the newest area (last area to first appear in FISH_SPECIES order)
    const seenAreas = new Set<string>();
    let newestArea = "" as FishArea;
    for (const fish of FISH_SPECIES) {
        for (const area of fish.areas) {
            if (!seenAreas.has(area)) {
                seenAreas.add(area);
                newestArea = area;
            }
        }
    }

    // Only check pondable fish from the newest area — best fish are always there
    const pondableFish = FISH_SPECIES.filter((f) => f.pondable !== false && f.areas.includes(newestArea));
    let bestBaseRoe = 0;
    for (const fish of pondableFish) {
        const availableMutations = MUTATIONS.filter((m) => !m.area || fish.areas.includes(m.area));
        for (const mutation of availableMutations) {
            const hasMutation = mutation.name !== "None";
            // Lucky catch = baseMaxWeight × mutation sizeMultiplier, 3 stars = 1.0 multiplier
            const maxWeight = fish.baseMaxWeight * mutation.sizeMultiplier;
            const fishValue = Math.round(maxWeight * fish.baseValue * 1.0 * mutation.multiplier);
            const baseRoe = calculateBaseRoePerHour(fishValue, hasMutation, fish.rarity);
            if (baseRoe > bestBaseRoe) bestBaseRoe = baseRoe;
        }
    }

    // Max pond size, all identical best fish, online, best boosts
    const maxPondSize = Math.max(...POND_SIZES);
    return bestBaseRoe * bestCashMultiplier * bestSpeedMultiplier * 1.0 * maxPondSize;
})();

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
    const initialized = React.useRef(false);

    // Initialize from DB settings once loaded, restore any persisted reminders
    React.useEffect(() => {
        if (!settings.loaded || initialized.current) return;
        initialized.current = true;

        setFeedType(settings.pondFeedType);
        setFeedBags(String(settings.pondFeedBags));
        setIsOffline(settings.pondIsOffline);

        const now = Date.now();

        if (settings.pondReminderFeedAt) {
            const fireAt = new Date(settings.pondReminderFeedAt).getTime();
            if (fireAt > now) {
                notifFeedTimer.current = setTimeout(() => {
                    new Notification("Abyss Fish Tracker", { body: "Your fish feed has expired!" });
                    notifFeedTimer.current = null;
                    setNotifFeedScheduled(false);
                    settings.updateSettings({ pondReminderFeedAt: null });
                }, fireAt - now);
                setNotifFeedScheduled(true);
            } else {
                settings.updateSettings({ pondReminderFeedAt: null });
            }
        }

        if (settings.pondReminderStorageAt) {
            const fireAt = new Date(settings.pondReminderStorageAt).getTime();
            if (fireAt > now) {
                notifStorageTimer.current = setTimeout(() => {
                    new Notification("Abyss Fish Tracker", { body: "Your roe storage is full!" });
                    notifStorageTimer.current = null;
                    setNotifStorageScheduled(false);
                    settings.updateSettings({ pondReminderStorageAt: null });
                }, fireAt - now);
                setNotifStorageScheduled(true);
            } else {
                settings.updateSettings({ pondReminderStorageAt: null });
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [settings.loaded]);

    const cancelNotifs = (opts?: { feed?: boolean; storage?: boolean }) => {
        const cancelFeed = opts?.feed ?? true;
        const cancelStorage = opts?.storage ?? true;
        if (cancelFeed && notifFeedTimer.current) {
            clearTimeout(notifFeedTimer.current);
            notifFeedTimer.current = null;
            setNotifFeedScheduled(false);
            settings.updateSettings({ pondReminderFeedAt: null });
        }
        if (cancelStorage && notifStorageTimer.current) {
            clearTimeout(notifStorageTimer.current);
            notifStorageTimer.current = null;
            setNotifStorageScheduled(false);
            settings.updateSettings({ pondReminderStorageAt: null });
        }
    };

    const handleFeedTypeChange = (v: string) => {
        setFeedType(v);
        cancelNotifs();
        settings.updateSettings({ pondFeedType: v });
    };

    const handleFeedBagsChange = (v: string) => {
        setFeedBags(v);
        cancelNotifs();
        const bags = parseInt(v, 10);
        if (!isNaN(bags) && bags >= 1) settings.updateSettings({ pondFeedBags: bags });
    };

    const handleModeChange = (offline: boolean) => {
        setIsOffline(offline);
        cancelNotifs();
        settings.updateSettings({ pondIsOffline: offline });
    };

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

    const hoursUntilFull = roeKgPerHour > 0 ? storageCapacity / roeKgPerHour : Infinity;
    const fullStorageValue = isFinite(hoursUntilFull) && hoursUntilFull > 0
        ? Math.round(totalRoePerHour * hoursUntilFull)
        : 0;

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


    // User's theoretical max: their actual pond fish + current race/artifacts/decoration/size,
    // but with the best possible feed and online mode
    const bestFeedSpeedBonus = Math.max(...FISH_FEED.map((f) => f.speedBonus));
    const userTheoreticalMaxRoe = React.useMemo(() => {
        let total = 0;
        for (const entry of pondFish) {
            const fish = FISH_SPECIES.find((f) => f.name === entry.fishName);
            if (!fish) continue;
            const hasMutation = entry.mutation !== "None";
            const baseRoe = calculateBaseRoePerHour(entry.value, hasMutation, fish.rarity);
            total += calculateBoostedRoePerHour(baseRoe, globalSettings, settings.decorationLevel, bestFeedSpeedBonus, false);
        }
        return total;
    }, [pondFish, globalSettings, settings.decorationLevel, bestFeedSpeedBonus]);

    const progressPercent = THEORETICAL_MAX_ROE_PER_HOUR > 0
        ? (userTheoreticalMaxRoe / THEORETICAL_MAX_ROE_PER_HOUR) * 100
        : 0;

    const hoursUntilFullWithFeed = React.useMemo(() => {
        if (feedDurationHours === Infinity || roeKgPerHour <= 0) return hoursUntilFull;
        const kgDuringFeed = roeKgPerHour * feedDurationHours;
        if (kgDuringFeed >= storageCapacity) return storageCapacity / roeKgPerHour;
        const remaining = storageCapacity - kgDuringFeed;
        return roeKgNoFeed > 0 ? feedDurationHours + remaining / roeKgNoFeed : Infinity;
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
        onScheduled: (fireAt: Date) => void,
        onFired: () => void
    ) => {
        if (!("Notification" in window)) return;
        Notification.requestPermission().then((perm) => {
            if (perm === "granted" && isFinite(hours) && hours > 0) {
                if (timerRef.current) clearTimeout(timerRef.current);
                const fireAt = new Date(Date.now() + hours * 3600_000);
                timerRef.current = setTimeout(() => {
                    new Notification("Abyss Fish Tracker", { body });
                    timerRef.current = null;
                    onFired();
                }, hours * 3600_000);
                onScheduled(fireAt);
            }
        });
    };

    const handleFeedReminder = () => {
        if (notifFeedScheduled) {
            cancelNotifs({ feed: true, storage: false });
        } else {
            scheduleNotification(
                feedDurationHours,
                "Your fish feed has expired!",
                notifFeedTimer,
                (fireAt) => {
                    setNotifFeedScheduled(true);
                    settings.updateSettings({ pondReminderFeedAt: fireAt.toISOString() });
                },
                () => {
                    setNotifFeedScheduled(false);
                    settings.updateSettings({ pondReminderFeedAt: null });
                }
            );
        }
    };

    const handleStorageReminder = () => {
        if (notifStorageScheduled) {
            cancelNotifs({ feed: false, storage: true });
        } else {
            scheduleNotification(
                hoursUntilFullWithFeed,
                "Your roe storage is full!",
                notifStorageTimer,
                (fireAt) => {
                    setNotifStorageScheduled(true);
                    settings.updateSettings({ pondReminderStorageAt: fireAt.toISOString() });
                },
                () => {
                    setNotifStorageScheduled(false);
                    settings.updateSettings({ pondReminderStorageAt: null });
                }
            );
        }
    };

    void cashMultiplier; // used implicitly via totalRoePerHour
    void toClockTime;

    if (pondFish.length === 0) return null;

    return (
        <>
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
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className={`h-6 text-xs gap-1 px-2 ${notifFeedScheduled ? "text-amber-400 hover:text-amber-300" : ""}`}
                                        onClick={handleFeedReminder}
                                    >
                                        {notifFeedScheduled
                                            ? <><IconBellOff className="h-3 w-3" /> Cancel</>
                                            : <><IconBell className="h-3 w-3" /> Remind Me</>
                                        }
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
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className={`h-6 text-xs gap-1 px-2 ${notifStorageScheduled ? "text-amber-400 hover:text-amber-300" : ""}`}
                                    onClick={handleStorageReminder}
                                >
                                    {notifStorageScheduled
                                        ? <><IconBellOff className="h-3 w-3" /> Cancel</>
                                        : <><IconBell className="h-3 w-3" /> Remind Me</>
                                    }
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
        <p className="text-xs text-center text-muted-foreground">
            The current theoretical max Roe $/hr is{" "}
            <span className="font-semibold text-foreground">${Math.round(THEORETICAL_MAX_ROE_PER_HOUR).toLocaleString()}/hr</span>
            <br />
            You are{" "}
            <span className="font-semibold text-foreground">{progressPercent < 1 ? progressPercent.toFixed(2) : progressPercent.toFixed(1)}%</span>
            {" "}of the way there.
        </p>
        </>
    );
}
