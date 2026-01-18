"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface CustomDescriptionInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  maxLength?: number;
}

export function CustomDescriptionInput({
  value,
  onChange,
  disabled,
  maxLength = 2000,
}: CustomDescriptionInputProps) {
  const characterCount = value.length;
  const isNearLimit = characterCount > maxLength * 0.8;
  const isOverLimit = characterCount > maxLength;

  return (
    <div className="space-y-2">
      <Label htmlFor="custom-description">Scenario Description</Label>
      <Textarea
        id="custom-description"
        placeholder="Describe your scenario in natural language. For example: 'A delivery van in Rotterdam damaged two parked cars during a storm' or 'A house fire in Munich caused by faulty wiring'"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="min-h-[120px] resize-none"
        maxLength={maxLength}
      />
      <div className="flex justify-between items-center">
        <p className="text-xs text-muted-foreground">
          The AI will infer claim type and complexity from your description.
        </p>
        <span
          className={`text-xs ${
            isOverLimit
              ? "text-destructive"
              : isNearLimit
              ? "text-warning"
              : "text-muted-foreground"
          }`}
        >
          {characterCount}/{maxLength}
        </span>
      </div>
    </div>
  );
}
