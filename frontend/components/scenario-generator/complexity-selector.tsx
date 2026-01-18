"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Complexity, COMPLEXITY_LEVELS } from "@/lib/locale-config";

interface ComplexitySelectorProps {
  value: Complexity;
  onChange: (value: Complexity) => void;
  disabled?: boolean;
}

const COMPLEXITY_ICONS: Record<Complexity, string> = {
  simple: "⚪",
  moderate: "🟡",
  complex: "🔴",
};

export function ComplexitySelector({ value, onChange, disabled }: ComplexitySelectorProps) {
  return (
    <div className="space-y-3">
      <Label>Complexity Level</Label>
      <RadioGroup
        value={value}
        onValueChange={(v) => onChange(v as Complexity)}
        disabled={disabled}
        className="grid gap-2"
      >
        {COMPLEXITY_LEVELS.map((level) => (
          <div key={level.value} className="flex items-start space-x-3">
            <RadioGroupItem
              value={level.value}
              id={`complexity-${level.value}`}
              className="mt-1"
            />
            <div className="grid gap-0.5">
              <Label
                htmlFor={`complexity-${level.value}`}
                className="flex items-center gap-2 font-medium cursor-pointer"
              >
                <span>{COMPLEXITY_ICONS[level.value]}</span>
                <span>{level.label}</span>
              </Label>
              <p className="text-xs text-muted-foreground">
                {level.description}
              </p>
            </div>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}
