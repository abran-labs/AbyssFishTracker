"use client";

import * as React from "react";
import { FishForm, type FishFormData } from "@/components/fish-form";
import { ImagePasteZone } from "@/components/image-paste-zone";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { type OcrResult } from "@/lib/ocr";
import { useSettings } from "@/components/settings-context";
import { FISH_SPECIES, CYCLE_TIMES, RACES, ARTIFACTS, DECORATION_LEVELS } from "@/lib/fish-config";
import { calculateBaseRoePerHour, calculateBoostedRoePerHour } from "@/lib/fish-utils";
import { type GlobalSettings } from "@/lib/types";
import { Copy, Check, BookmarkPlus } from "lucide-react";
import { useAuth } from "@/components/auth-context";
import { type FishEntry } from "@/lib/types";

const DISCORD_SEP = "> ---------------------------------------->";

function buildDiscordText(formData: FishFormData, baseRoe: number | null): string {
  const displayName = formData.fishName.replace(/ \((Head|Meat)\)$/, (_, dt) => ` ${dt}`);
  const starLabel = formData.stars === 0 ? "Dead" : `${formData.stars} Star`;
  const lines = [
    `**${displayName}**`,
    `**\`${formData.weight.toLocaleString()} kg\`** | **\`${starLabel}\`** | **\`${formData.mutation}\`**`,
    DISCORD_SEP,
    `> :moneybag: Base Sell: \`$${formData.value.toLocaleString()}\``,
  ];
  if (baseRoe !== null) {
    lines.push(`> :fish: Base Roe $/hour: \`$${baseRoe.toLocaleString()}\``);
  }
  lines.push(DISCORD_SEP);
  return lines.join("\n");
}

function fishFingerprint(formData: FishFormData): string {
  return `${formData.fishName}|${formData.weight}|${formData.stars}|${formData.mutation}`;
}

interface CalculatorTabProps {
  onAdd?: (data: Omit<FishEntry, "id" | "createdAt" | "updatedAt">) => Promise<FishEntry>;
}

export function CalculatorTab({ onAdd }: CalculatorTabProps) {
  const [ocrData, setOcrData] = React.useState<{
    fishName?: string;
    weight?: number;
    stars?: number;
    mutation?: string;
  } | undefined>(undefined);
  const [formKey, setFormKey] = React.useState(0);
  const settings = useSettings();
  const { user } = useAuth();
  const [copied, setCopied] = React.useState(false);
  const [savedFingerprint, setSavedFingerprint] = React.useState<string | null>(null);

  const handleOcrResult = React.useCallback((result: OcrResult) => {
    const baseName = result.fishName ?? undefined;
    const fishName = baseName && result.dropType ? `${baseName} (${result.dropType})` : baseName;
    setOcrData({
      fishName,
      weight: result.weight ?? undefined,
      stars: result.stars ?? undefined,
      mutation: result.mutation ?? undefined,
    });
    setFormKey((k) => k + 1);
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fish Calculator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ImagePasteZone onResult={handleOcrResult} />
        <FishForm
          key={formKey}
          initialData={ocrData}
          settings={settings}
          renderActions={(formData) => {
            if (!formData) return null;
            const fish = FISH_SPECIES.find((f) => f.name === formData.fishName.replace(/ \((Meat|Head)\)$/, ""));
            const isPondable = fish?.pondable !== false;
            const hasMutation = formData.mutation !== "None";
            const baseRoe = isPondable && fish ? calculateBaseRoePerHour(formData.value, hasMutation, fish.rarity) : null;
            return (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(buildDiscordText(formData, baseRoe));
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                >
                  {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                  {copied ? "Copied!" : "Copy for Discord"}
                </Button>
                {user && onAdd && (() => {
                  const fp = fishFingerprint(formData);
                  const isSaved = savedFingerprint === fp;
                  return (
                    <Button
                      variant="outline"
                      size="sm"
                      className={isSaved ? "border-green-500 text-green-600 hover:text-green-600 hover:border-green-500" : ""}
                      disabled={isSaved}
                      onClick={async () => {
                        await onAdd({
                          fishName: formData.fishName,
                          weight: formData.weight,
                          stars: formData.stars,
                          mutation: formData.mutation,
                        });
                        setSavedFingerprint(fp);
                      }}
                    >
                      {isSaved ? <Check className="w-4 h-4 mr-1" /> : <BookmarkPlus className="w-4 h-4 mr-1" />}
                      {isSaved ? "Saved!" : "Save to Fish Log"}
                    </Button>
                  );
                })()}
              </>
            );
          }}
        />
      </CardContent>
    </Card>
  );
}
