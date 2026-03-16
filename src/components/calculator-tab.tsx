"use client";

import * as React from "react";
import { FishForm } from "@/components/fish-form";
import { ImagePasteZone } from "@/components/image-paste-zone";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type OcrResult } from "@/lib/ocr";

export function CalculatorTab() {
  const [ocrData, setOcrData] = React.useState<{
    fishName?: string;
    weight?: number;
    stars?: number;
    mutation?: string;
  } | undefined>(undefined);
  const [formKey, setFormKey] = React.useState(0);

  const handleOcrResult = React.useCallback((result: OcrResult) => {
    setOcrData({
      fishName: result.fishName ?? undefined,
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
        <FishForm key={formKey} initialData={ocrData} renderActions={() => null} />
      </CardContent>
    </Card>
  );
}
