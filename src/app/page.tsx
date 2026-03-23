"use client";

import * as React from "react";
import Image from "next/image";
import { Users, Calculator } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalculatorTab } from "@/components/calculator-tab";
import { FishLogTab } from "@/components/fish-log-tab";
import { FishPondTab } from "@/components/fish-pond-tab";
import { FeedbackTab } from "@/components/feedback-tab";
import { GuideTab } from "@/components/guide-tab";
import { type FishEntry } from "@/lib/types";
import {
  getServerEntries,
  addServerEntry,
  updateServerEntry,
  deleteServerEntry,
  getServerPondSnapshots,
  saveServerPondSnapshot,
  saveServerPondSize,
  removeFishFromLoadout,
  moveFishBetweenLoadouts,
  addEntryAndToPond,
  renameLoadout,
  type PondSnapshotData,
} from "@/lib/fish-actions";
import { subscribeToPendingCount, getPendingCount } from "@/lib/stat-tracker";
import { useAuth } from "@/components/auth-context";
import { LoginModal } from "@/components/login-modal";
import { SettingsProvider } from "@/components/settings-context";
import { GlobalSettingsBar } from "@/components/global-settings-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FooterSection } from "@/components/footer-section";

const ACTIVE_TAB_KEY = "activeTab";
const ACTIVE_LOADOUT_KEY = "activeLoadoutIndex";
const VALID_TABS = ["calculator", "log", "pond", "guide", "feedback"];

export default function Home() {
  const { user, loading, logout } = useAuth();
  const [entries, setEntries] = React.useState<FishEntry[]>([]);
  const [pondSnapshots, setPondSnapshots] = React.useState<PondSnapshotData[]>([]);
  const [activeLoadoutIndex, setActiveLoadoutIndex] = React.useState(0);
  const [mounted, setMounted] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("calculator");
  const [fishCount, setFishCount] = React.useState<number | null>(null);
  const [userCount, setUserCount] = React.useState<number | null>(null);
  const [calculatedCount, setCalculatedCount] = React.useState<number | null>(null);
  const [pendingCalculations, setPendingCalculations] = React.useState(0);
  const [showLogin, setShowLogin] = React.useState(false);

  React.useEffect(() => {
    const saved = localStorage.getItem(ACTIVE_TAB_KEY);
    if (saved && VALID_TABS.includes(saved)) {
      setActiveTab(saved);
    }
    const savedLoadout = localStorage.getItem(ACTIVE_LOADOUT_KEY);
    if (savedLoadout !== null) {
      const idx = parseInt(savedLoadout, 10);
      if (idx >= 0 && idx <= 4) setActiveLoadoutIndex(idx);
    }
  }, []);

  const handleTabChange = React.useCallback((tab: string) => {
    setActiveTab(tab);
    localStorage.setItem(ACTIVE_TAB_KEY, tab);
  }, []);

  React.useEffect(() => {
    // Sync with local pending calculations for optimistic UI
    setPendingCalculations(getPendingCount());
    const unsubscribe = subscribeToPendingCount(setPendingCalculations);

    // Fetch stats regardless of auth
    Promise.all([
      fetch("/api/stats?stat=fish").then((r) => r.json()),
      fetch("/api/stats").then((r) => r.json()),
      fetch("/api/stats?stat=calculated").then((r) => r.json()),
    ]).then(([fishData, userData, calculatedData]) => {
      setFishCount(Number(fishData.message));
      setUserCount(Number(userData.message));
      setCalculatedCount(Number(calculatedData.message));
    }).catch(() => { });

    if (loading) return;

    if (user) {
      Promise.all([getServerEntries(), getServerPondSnapshots()]).then(
        ([serverEntries, serverSnapshots]) => {
          setEntries(serverEntries);
          setPondSnapshots(serverSnapshots);
          setMounted(true);
        }
      );
    } else {
      setMounted(true);
    }

    return unsubscribe;
  }, [user, loading]);

  const handleAddEntry = React.useCallback(
    async (data: Omit<FishEntry, "id" | "createdAt" | "updatedAt">) => {
      const newEntry = await addServerEntry(data);
      setEntries((prev) => [newEntry, ...prev]);
      return newEntry;
    },
    []
  );

  const handleUpdateEntry = React.useCallback(
    async (
      id: string,
      data: Omit<FishEntry, "id" | "createdAt" | "updatedAt">
    ) => {
      const updated = await updateServerEntry(id, data);
      setEntries((prev) => prev.map((e) => (e.id === id ? updated : e)));
      return updated;
    },
    []
  );

  const handleDeleteEntry = React.useCallback(async (id: string) => {
    await deleteServerEntry(id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
    // Server already cleaned up loadouts; sync local state
    setPondSnapshots((prev) =>
      prev.map((s) => ({
        ...s,
        fishIds: s.fishIds.filter((fid) => fid !== id),
      }))
    );
  }, []);

  const handleRestoreEntry = React.useCallback(async (entry: FishEntry) => {
    const restored = await addServerEntry(entry);
    setEntries((prev) => [restored, ...prev]);
  }, []);

  const handleUpdatePondSnapshot = React.useCallback(async (loadoutIndex: number, fishIds: string[], pondSize: number) => {
    const snapshot = await saveServerPondSnapshot(loadoutIndex, fishIds, pondSize);
    setPondSnapshots((prev) => {
      const existing = prev.find((s) => s.loadoutIndex === loadoutIndex);
      if (existing) return prev.map((s) => (s.loadoutIndex === loadoutIndex ? snapshot : s));
      return [...prev, snapshot].sort((a, b) => a.loadoutIndex - b.loadoutIndex);
    });
  }, []);

  const handlePondSizeChange = React.useCallback(async (size: number) => {
    const snapshots = await saveServerPondSize(size);
    setPondSnapshots(snapshots);
  }, []);

  const handleLoadoutChange = React.useCallback((index: number) => {
    setActiveLoadoutIndex(index);
    localStorage.setItem(ACTIVE_LOADOUT_KEY, index.toString());
  }, []);

  const handleRemoveFromPond = React.useCallback(async (loadoutIndex: number, fishId: string) => {
    const snapshot = await removeFishFromLoadout(loadoutIndex, fishId);
    setPondSnapshots((prev) =>
      prev.map((s) => (s.loadoutIndex === loadoutIndex ? snapshot : s))
    );
  }, []);

  const handleMoveBetweenPonds = React.useCallback(async (fishId: string, fromIndex: number, toIndex: number) => {
    const { from, to } = await moveFishBetweenLoadouts(fishId, fromIndex, toIndex);
    setPondSnapshots((prev) => {
      let updated = prev.map((s) => {
        if (s.loadoutIndex === fromIndex) return from;
        if (s.loadoutIndex === toIndex) return to;
        return s;
      });
      // If target didn't exist before, add it
      if (!prev.find((s) => s.loadoutIndex === toIndex)) {
        updated = [...updated, to].sort((a, b) => a.loadoutIndex - b.loadoutIndex);
      }
      return updated;
    });
  }, []);

  const handleSendToPond = React.useCallback(async (fishId: string, loadoutIndex: number) => {
    // Add fish to a custom loadout (from fish log)
    const existing = pondSnapshots.find((s) => s.loadoutIndex === loadoutIndex);
    const fishIds = existing ? [...existing.fishIds, fishId] : [fishId];
    const pondSize = existing?.pondSize ?? pondSnapshots[0]?.pondSize ?? 6;
    const snapshot = await saveServerPondSnapshot(loadoutIndex, fishIds, pondSize);
    setPondSnapshots((prev) => {
      const found = prev.find((s) => s.loadoutIndex === loadoutIndex);
      if (found) return prev.map((s) => (s.loadoutIndex === loadoutIndex ? snapshot : s));
      return [...prev, snapshot].sort((a, b) => a.loadoutIndex - b.loadoutIndex);
    });
  }, [pondSnapshots]);

  const handleAddEntryAndToPond = React.useCallback(async (
    data: Omit<FishEntry, "id" | "createdAt" | "updatedAt">,
    loadoutIndex: number
  ) => {
    const { entry, snapshot } = await addEntryAndToPond(data, loadoutIndex);
    setEntries((prev) => [entry, ...prev]);
    setPondSnapshots((prev) => {
      const found = prev.find((s) => s.loadoutIndex === loadoutIndex);
      if (found) return prev.map((s) => (s.loadoutIndex === loadoutIndex ? snapshot : s));
      return [...prev, snapshot].sort((a, b) => a.loadoutIndex - b.loadoutIndex);
    });
    return entry;
  }, []);

  const handleRenameLoadout = React.useCallback(async (loadoutIndex: number, name: string) => {
    const snapshot = await renameLoadout(loadoutIndex, name);
    setPondSnapshots((prev) => {
      const found = prev.find((s) => s.loadoutIndex === loadoutIndex);
      if (found) return prev.map((s) => (s.loadoutIndex === loadoutIndex ? snapshot : s));
      return [...prev, snapshot].sort((a, b) => a.loadoutIndex - b.loadoutIndex);
    });
  }, []);

  if (!mounted || loading) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border/40 px-4 lg:px-8 py-4">
        <div className="w-full flex items-center justify-between">
          <a href="https://abyss-fish-tracker.abran.dev" className="text-xl font-semibold hover:opacity-75 transition-opacity">Abyss-Fish-Tracker</a>

          {fishCount !== null && userCount !== null && calculatedCount !== null && (
            <div className="hidden sm:flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><Users className="h-4 w-4" />{userCount.toLocaleString()} users</span>
              <span className="text-border">·</span>
              <span className="flex items-center gap-1.5"><Image src="/fish.png" alt="Fish" width={16} height={16} className="inline-block" style={{ filter: "brightness(0.65)" }} />{fishCount.toLocaleString()} fish logged</span>
              <span className="text-border">·</span>
              <span className="flex items-center gap-1.5"><Calculator className="h-4 w-4" />{((calculatedCount ?? 0) + pendingCalculations).toLocaleString()} fish calculated</span>
            </div>
          )}

          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                {user.email}
              </span>
              <Button variant="ghost" size="sm" onClick={logout}>
                Log out
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowLogin(true)}
            >
              Log in
            </Button>
          )}
        </div>
      </header>

      <main className="flex-1 px-6 py-6 max-w-5xl mx-auto w-full">
        <SettingsProvider isLoggedIn={!!user}>
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <div className="flex flex-col gap-2 mb-3">
              <TabsList className="self-start">
                <TabsTrigger value="calculator">Calculator</TabsTrigger>
                <TabsTrigger value="guide">Guide</TabsTrigger>
                <TabsTrigger value="log">Fish Log</TabsTrigger>
                <TabsTrigger value="pond">Fish Pond</TabsTrigger>
                <TabsTrigger value="feedback">Feedback</TabsTrigger>
              </TabsList>
              <GlobalSettingsBar activeTab={activeTab} />
            </div>

            <TabsContent value="calculator">
              <CalculatorTab onAdd={user ? handleAddEntry : undefined} />
              <p className="mt-6 text-sm text-muted-foreground text-center italic">
                🍄 <span style={{ color: "rgb(189, 135, 204)" }}>Gloomspore Valley</span>!
              </p>
            </TabsContent>

            <TabsContent value="guide">
              <GuideTab />
            </TabsContent>

            <TabsContent value="log">
              {user ? (
                <FishLogTab
                  entries={entries}
                  pondSnapshots={pondSnapshots}
                  onAdd={handleAddEntry}
                  onUpdate={handleUpdateEntry}
                  onDelete={handleDeleteEntry}
                  onRestore={handleRestoreEntry}
                  onSendToPond={handleSendToPond}
                />
              ) : (
                <Card>
                  <CardContent className="py-12 text-center space-y-4">
                    <p className="text-lg font-medium">Fish Log</p>
                    <ul className="text-left text-sm text-muted-foreground mx-auto space-y-1 w-fit">
                      <li className="whitespace-nowrap">• Log every fish you catch</li>
                      <li className="whitespace-nowrap">• Sort by value, roe $/hr, weight, and more</li>
                      <li className="whitespace-nowrap">• Autofill catches from screenshots</li>
                    </ul>
                    <Button onClick={() => setShowLogin(true)}>Create Free Account</Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="pond">
              {user ? (
                <FishPondTab
                  entries={entries}
                  pondSnapshots={pondSnapshots}
                  activeLoadoutIndex={activeLoadoutIndex}
                  onLoadoutChange={handleLoadoutChange}
                  onUpdateSnapshot={handleUpdatePondSnapshot}
                  onPondSizeChange={handlePondSizeChange}
                  onRenameLoadout={handleRenameLoadout}
                  onRemoveFromPond={handleRemoveFromPond}
                  onMoveBetweenPonds={handleMoveBetweenPonds}
                  onAdd={handleAddEntryAndToPond}
                  onUpdate={handleUpdateEntry}
                  onDeleteEntry={handleDeleteEntry}
                  onRestore={handleRestoreEntry}
                />
              ) : (
                <Card>
                  <CardContent className="py-12 text-center space-y-4">
                    <p className="text-lg font-medium">Fish Pond</p>
                    <ul className="text-left text-sm text-muted-foreground mx-auto space-y-1 w-fit">
                      <li className="whitespace-nowrap">• Setup AFK sessions and get notified when to log back in</li>
                      <li className="whitespace-nowrap">• Get optimal fish swap recommendations</li>
                      <li className="whitespace-nowrap">• Calculate roe production</li>
                    </ul>
                    <Button onClick={() => setShowLogin(true)}>Create Free Account</Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="feedback">
              <FeedbackTab loggedIn={!!user} onLoginClick={() => setShowLogin(true)} />
            </TabsContent>
          </Tabs>
        </SettingsProvider>
      </main>

      <FooterSection />

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </div>
  );
}
