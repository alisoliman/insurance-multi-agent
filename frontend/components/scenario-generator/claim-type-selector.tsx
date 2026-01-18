"use client";

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ClaimType, CLAIM_TYPES } from "@/lib/locale-config";

interface ClaimTypeSelectorProps {
  value: ClaimType;
  onChange: (value: ClaimType) => void;
  disabled?: boolean;
}

const CLAIM_TYPE_ICONS: Record<ClaimType, string> = {
  auto: "🚗",
  home: "🏠",
  health: "🏥",
  life: "❤️",
  commercial: "🏢",
};

export function ClaimTypeSelector({ value, onChange, disabled }: ClaimTypeSelectorProps) {
  const selectedType = CLAIM_TYPES.find((t) => t.value === value);

  return (
    <div className="space-y-2">
      <Label htmlFor="claim-type-select">Claim Type</Label>
      <Select
        value={value}
        onValueChange={(v) => onChange(v as ClaimType)}
        disabled={disabled}
      >
        <SelectTrigger id="claim-type-select" className="w-full">
          <SelectValue placeholder="Select claim type" />
        </SelectTrigger>
        <SelectContent>
          {CLAIM_TYPES.map((type) => (
            <SelectItem key={type.value} value={type.value}>
              <span className="flex items-center gap-2">
                <span>{CLAIM_TYPE_ICONS[type.value]}</span>
                <span>{type.label}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selectedType && (
        <p className="text-xs text-muted-foreground">
          {selectedType.description}
        </p>
      )}
    </div>
  );
}
