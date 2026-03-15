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

export default function Home() {
  const [entries, setEntries] = React.useState<FishEntry[]>([]);
  const [pondSize, setPondSize] = React.useState(6);
  const [mounted, setMounted] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("calculator");

  React.useEffect(() => {
    setEntries(getEntries());
    setPondSize(getPondSize());
    setMounted(true);
  }, []);

  const handleAddEntry = React.useCallback(
    (data: Omit<FishEntry, "id" | "createdAt" | "updatedAt">) => {
      const newEntry = addEntryToStorage(data);
      setEntries((prev) => [newEntry, ...prev]);
      return newEntry;
    },
    []
  );

  const handleUpdateEntry = React.useCallback(
    (id: string, data: Omit<FishEntry, "id" | "createdAt" | "updatedAt">) => {
      const updated = updateEntryInStorage(id, data);
      setEntries((prev) => prev.map((e) => (e.id === id ? updated : e)));
      return updated;
    },
    []
  );

  const handleDeleteEntry = React.useCallback((id: string) => {
    deleteEntryFromStorage(id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  const handleRestoreEntry = React.useCallback((entry: FishEntry) => {
    restoreEntryToStorage(entry);
    setEntries((prev) => [entry, ...prev]);
  }, []);

  const handlePondSizeChange = React.useCallback((size: number) => {
    savePondSize(size);
    setPondSize(size);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border/40 px-6 py-4">
        <h1 className="text-xl font-semibold">Abyss-Fish-Tracker</h1>
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
    </div>
  );
}
