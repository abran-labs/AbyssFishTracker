"use client";

import * as React from "react";
import Image from "next/image";
import { Users, Calculator } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalculatorTab } from "@/components/calculator-tab";
import { FishLogTab } from "@/components/fish-log-tab";
import { FishPondTab } from "@/components/fish-pond-tab";
import { type FishEntry } from "@/lib/types";
import {
  getServerEntries,
  addServerEntry,
  updateServerEntry,
  deleteServerEntry,
  getServerPondSnapshot,
  saveServerPondSnapshot,
  saveServerPondSize,
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

export default function Home() {
  const { user, loading, logout } = useAuth();
  const [entries, setEntries] = React.useState<FishEntry[]>([]);
  const [pondSnapshot, setPondSnapshot] = React.useState<PondSnapshotData | null>(null);
  const [mounted, setMounted] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("calculator");
  const [fishCount, setFishCount] = React.useState<number | null>(null);
  const [userCount, setUserCount] = React.useState<number | null>(null);
  const [calculatedCount, setCalculatedCount] = React.useState<number | null>(null);
  const [pendingCalculations, setPendingCalculations] = React.useState(0);
  const [showLogin, setShowLogin] = React.useState(false);

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
      Promise.all([getServerEntries(), getServerPondSnapshot()]).then(
        ([serverEntries, serverSnapshot]) => {
          setEntries(serverEntries);
          setPondSnapshot(serverSnapshot);
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
  }, []);

  const handleRestoreEntry = React.useCallback(async (entry: FishEntry) => {
    const restored = await addServerEntry(entry);
    setEntries((prev) => [restored, ...prev]);
  }, []);

  const handleUpdatePondSnapshot = React.useCallback(async (fishIds: string[], pondSize: number) => {
    const snapshot = await saveServerPondSnapshot(fishIds, pondSize);
    setPondSnapshot(snapshot);
  }, []);

  const handlePondSizeChange = React.useCallback(async (size: number) => {
    const snapshot = await saveServerPondSize(size);
    setPondSnapshot(snapshot);
  }, []);

  if (!mounted || loading) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border/40 px-4 lg:px-8 py-4">
        <div className="w-full flex items-center justify-between">
          <h1 className="text-xl font-semibold">Abyss-Fish-Tracker</h1>

          {fishCount !== null && userCount !== null && calculatedCount !== null && (
            <div className="hidden sm:flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><Users className="h-4 w-4" />{userCount} users</span>
              <span className="text-border">·</span>
              <span className="flex items-center gap-1.5"><Image src="/fish.png" alt="Fish" width={16} height={16} className="inline-block" style={{ filter: "brightness(0.65)" }} />{fishCount} fish logged</span>
              <span className="text-border">·</span>
              <span className="flex items-center gap-1.5"><Calculator className="h-4 w-4" />{(calculatedCount ?? 0) + pendingCalculations} fish calculated</span>
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
          <Tabs defaultValue="calculator" onValueChange={setActiveTab}>
            <div className="flex flex-col gap-2 mb-3">
              <TabsList className="self-start">
                <TabsTrigger value="calculator">Calculator</TabsTrigger>
                <TabsTrigger value="log">Fish Log</TabsTrigger>
                <TabsTrigger value="pond">Fish Pond</TabsTrigger>
              </TabsList>
              <GlobalSettingsBar />
            </div>

            <TabsContent value="calculator">
              <CalculatorTab />
              <p className="mt-6 text-sm text-muted-foreground text-center">
                Sorry for the downtime earlier today — hope this update makes up for it!
              </p>
            </TabsContent>

            <TabsContent value="log">
              {user ? (
                <FishLogTab
                  entries={entries}
                  onAdd={handleAddEntry}
                  onUpdate={handleUpdateEntry}
                  onDelete={handleDeleteEntry}
                  onRestore={handleRestoreEntry}
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
                  snapshot={pondSnapshot}
                  onUpdateSnapshot={handleUpdatePondSnapshot}
                  onPondSizeChange={handlePondSizeChange}
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
          </Tabs>
        </SettingsProvider>
      </main>

      <FooterSection />

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </div>
  );
}
