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
    });
    const [loaded, setLoaded] = React.useState(false);

    // Load settings on mount
    React.useEffect(() => {
        if (isLoggedIn) {
            getServerSettings().then((serverSettings) => {
                setSettings(serverSettings);
                saveToLocalStorage(serverSettings);
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
