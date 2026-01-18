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
import { Locale, LOCALES, getLocaleOptions } from "@/lib/locale-config";

interface LocaleSelectorProps {
  value: Locale;
  onChange: (value: Locale) => void;
  disabled?: boolean;
}

export function LocaleSelector({ value, onChange, disabled }: LocaleSelectorProps) {
  const locales = getLocaleOptions();

  return (
    <div className="space-y-2">
      <Label htmlFor="locale-select">Region / Locale</Label>
      <Select
        value={value}
        onValueChange={(v) => onChange(v as Locale)}
        disabled={disabled}
      >
        <SelectTrigger id="locale-select" className="w-full">
          <SelectValue placeholder="Select a region" />
        </SelectTrigger>
        <SelectContent>
          {locales.map((locale) => (
            <SelectItem key={locale.code} value={locale.code}>
              <span className="flex items-center gap-2">
                <span>{locale.flag}</span>
                <span>{locale.name}</span>
                <span className="text-muted-foreground text-xs">
                  ({locale.currency})
                </span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        Generated scenarios will use {LOCALES[value].language} language, {LOCALES[value].currency} currency, and culturally appropriate names/addresses.
      </p>
    </div>
  );
}
