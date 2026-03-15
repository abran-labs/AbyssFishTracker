"use client";

import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalculatorTab } from "@/components/calculator-tab";
import { FishLogTab } from "@/components/fish-log-tab";
import { FishPondTab } from "@/components/fish-pond-tab";
import { type FishEntry } from "@/lib/types";
import {
  getEntries,
  addEntry as addEntryToStorage,
  updateEntry as updateEntryInStorage,
  deleteEntry as deleteEntryFromStorage,
  restoreEntry as restoreEntryToStorage,
  getPondSize,
  savePondSize,
} from "@/lib/fish-storage";
import {
  getServerEntries,
  addServerEntry,
  updateServerEntry,
  deleteServerEntry,
  getServerPondSize,
  saveServerPondSize,
} from "@/lib/fish-actions";
import { useAuth } from "@/components/auth-context";
import { LoginModal } from "@/components/login-modal";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { user, loading, logout } = useAuth();
  const [entries, setEntries] = React.useState<FishEntry[]>([]);
  const [pondSize, setPondSize] = React.useState(6);
  const [mounted, setMounted] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("calculator");
  const [showLogin, setShowLogin] = React.useState(false);

  // Load data based on auth state
  React.useEffect(() => {
    if (loading) return;

    if (user) {
      Promise.all([getServerEntries(), getServerPondSize()]).then(
        ([serverEntries, serverPondSize]) => {
          setEntries(serverEntries);
          setPondSize(serverPondSize);
          setMounted(true);
        }
      );
    } else {
      setEntries(getEntries());
      setPondSize(getPondSize());
      setMounted(true);
    }
  }, [user, loading]);

  const handleAddEntry = React.useCallback(
    async (data: Omit<FishEntry, "id" | "createdAt" | "updatedAt">) => {
      if (user) {
        const newEntry = await addServerEntry(data);
        setEntries((prev) => [newEntry, ...prev]);
        return newEntry;
      } else {
        const newEntry = addEntryToStorage(data);
        setEntries((prev) => [newEntry, ...prev]);
        return newEntry;
      }
    },
    [user]
  );

  const handleUpdateEntry = React.useCallback(
    async (
      id: string,
      data: Omit<FishEntry, "id" | "createdAt" | "updatedAt">
    ) => {
      if (user) {
        const updated = await updateServerEntry(id, data);
        setEntries((prev) => prev.map((e) => (e.id === id ? updated : e)));
        return updated;
      } else {
        const updated = updateEntryInStorage(id, data);
        setEntries((prev) => prev.map((e) => (e.id === id ? updated : e)));
        return updated;
      }
    },
    [user]
  );

  const handleDeleteEntry = React.useCallback(
    async (id: string) => {
      if (user) {
        await deleteServerEntry(id);
        setEntries((prev) => prev.filter((e) => e.id !== id));
      } else {
        deleteEntryFromStorage(id);
        setEntries((prev) => prev.filter((e) => e.id !== id));
      }
    },
    [user]
  );

  const handleRestoreEntry = React.useCallback(
    async (entry: FishEntry) => {
      if (user) {
        const restored = await addServerEntry(entry);
        setEntries((prev) => [restored, ...prev]);
      } else {
        restoreEntryToStorage(entry);
        setEntries((prev) => [entry, ...prev]);
      }
    },
    [user]
  );

  const handlePondSizeChange = React.useCallback(
    async (size: number) => {
      if (user) {
        await saveServerPondSize(size);
      } else {
        savePondSize(size);
      }
      setPondSize(size);
    },
    [user]
  );

  if (!mounted || loading) return null;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Local storage banner */}
      {!user && (
        <div className="bg-red-950/60 border-b border-red-800/40 px-6 py-2 text-center">
          <p className="text-sm text-red-400">
            Storage is local — your data is saved in this browser only.{" "}
            <button
              onClick={() => setShowLogin(true)}
              className="text-red-200 underline underline-offset-2 hover:text-red-100"
            >
              Log in
            </button>{" "}
            to sync across devices.
          </p>
        </div>
      )}

      <header className="border-b border-border/40 px-6 py-4">
        <div className="max-w-5xl mx-auto w-full flex items-center justify-between">
          <h1 className="text-xl font-semibold">Abyss-Fish-Tracker</h1>

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
        <Tabs defaultValue="calculator" onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="calculator">Calculator</TabsTrigger>
            <TabsTrigger value="log">Fish Log</TabsTrigger>
            <TabsTrigger value="pond">Fish Pond</TabsTrigger>
          </TabsList>

          <TabsContent value="calculator">
            <CalculatorTab />
          </TabsContent>

          <TabsContent value="log">
            <FishLogTab
              entries={entries}
              pondSize={pondSize}
              onAdd={handleAddEntry}
              onUpdate={handleUpdateEntry}
              onDelete={handleDeleteEntry}
              onRestore={handleRestoreEntry}
            />
          </TabsContent>

          <TabsContent value="pond">
            <FishPondTab
              entries={entries}
              pondSize={pondSize}
              onPondSizeChange={handlePondSizeChange}
              isActive={activeTab === "pond"}
              isAuthenticated={!!user}
            />
          </TabsContent>
        </Tabs>
      </main>

      <footer className="border-t border-border/40 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Abyss-Fish-Tracker</p>
          <p className="text-sm text-muted-foreground">
            Fish value calculator for ABYSS
          </p>
        </div>
      </footer>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </div>
  );
}
