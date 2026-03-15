"use client";

import { FishForm } from "@/components/fish-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function CalculatorTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Fish Calculator</CardTitle>
      </CardHeader>
      <CardContent>
        <FishForm renderActions={() => null} />
      </CardContent>
    </Card>
  );
}
