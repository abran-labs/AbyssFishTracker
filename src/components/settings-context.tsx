"use client";

import * as React from "react";
import { type UserSettingsData, getServerSettings, saveServerSettings } from "@/lib/fish-actions";

export interface SettingsContextValue {
    race: string;
    artifact1: string;
    artifact2: string;
    artifact3: string;
    roeStorageLevel: number;
    decorationLevel: number;
    pondSortNoticeDismissed: boolean;
    ignoredSwapFishIds: string[];
    pondIsOffline: boolean;
    pondFeedType: string;
    pondFeedBags: number;
    pondReminderFeedAt: string | null;
    pondReminderStorageAt: string | null;
    updateSettings: (partial: Partial<UserSettingsData>) => void;
    loaded: boolean;
}

const DEFAULT: SettingsContextValue = {
    race: "None",
    artifact1: "None",
    artifact2: "None",
    artifact3: "None",
    roeStorageLevel: 0,
    decorationLevel: 0,
    pondSortNoticeDismissed: false,
    ignoredSwapFishIds: [],
    pondIsOffline: true,
    pondFeedType: "None",
    pondFeedBags: 1,
    pondReminderFeedAt: null,
    pondReminderStorageAt: null,
    updateSettings: () => { },
    loaded: false,
};

const LS_KEY = "abyss-fish-settings";

const SettingsContext = React.createContext<SettingsContextValue>(DEFAULT);

export function useSettings() {
    return React.useContext(SettingsContext);
}

function loadFromLocalStorage(): Partial<UserSettingsData> {
    try {
        const raw = localStorage.getItem(LS_KEY);
        if (raw) return JSON.parse(raw);
    } catch { }
    return {};
}

function saveToLocalStorage(data: UserSettingsData) {
    try {
        localStorage.setItem(LS_KEY, JSON.stringify(data));
    } catch { }
}

interface SettingsProviderProps {
    children: React.ReactNode;
    isLoggedIn: boolean;
}

export function SettingsProvider({ children, isLoggedIn }: SettingsProviderProps) {
    const [settings, setSettings] = React.useState<UserSettingsData>({
        race: "None",
        artifact1: "None",
        artifact2: "None",
        artifact3: "None",
        roeStorageLevel: 0,
        decorationLevel: 0,
        pondSortNoticeDismissed: false,
        ignoredSwapFishIds: [],
        pondIsOffline: true,
        pondFeedType: "None",
        pondFeedBags: 1,
        pondReminderFeedAt: null,
        pondReminderStorageAt: null,
    });
    const [loaded, setLoaded] = React.useState(false);

    // Load settings on mount
    React.useEffect(() => {
        if (isLoggedIn) {
            getServerSettings().then((serverSettings) => {
                if (serverSettings === null) {
                    // New account — migrate any existing localStorage values into the DB
                    const local = loadFromLocalStorage();
                    const migrated: UserSettingsData = {
                        race: local.race ?? "None",
                        artifact1: local.artifact1 ?? "None",
                        artifact2: local.artifact2 ?? "None",
                        artifact3: local.artifact3 ?? "None",
                        roeStorageLevel: local.roeStorageLevel ?? 0,
                        decorationLevel: local.decorationLevel ?? 0,
                        pondSortNoticeDismissed: false,
                        ignoredSwapFishIds: [],
                        pondIsOffline: true,
                        pondFeedType: "None",
                        pondFeedBags: 1,
                        pondReminderFeedAt: null,
                        pondReminderStorageAt: null,
                    };
                    setSettings(migrated);
                    saveToLocalStorage(migrated);
                    saveServerSettings(migrated).catch(() => { });
                } else {
                    setSettings(serverSettings);
                    saveToLocalStorage(serverSettings);
                }
                setLoaded(true);
            }).catch(() => {
                const local = loadFromLocalStorage();
                setSettings((prev) => ({ ...prev, ...local }));
                setLoaded(true);
            });
        } else {
            const local = loadFromLocalStorage();
            setSettings((prev) => ({ ...prev, ...local }));
            setLoaded(true);
        }
    }, [isLoggedIn]);

    const updateSettings = React.useCallback(
        (partial: Partial<UserSettingsData>) => {
            setSettings((prev) => {
                const next = { ...prev, ...partial };
                saveToLocalStorage(next);
                return next;
            });
            if (isLoggedIn) {
                saveServerSettings(partial).catch(() => { });
            }
        },
        [isLoggedIn]
    );

    const value = React.useMemo<SettingsContextValue>(
        () => ({
            ...settings,
            updateSettings,
            loaded,
        }),
        [settings, updateSettings, loaded]
    );

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );
}
