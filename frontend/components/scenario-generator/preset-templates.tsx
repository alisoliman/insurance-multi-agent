"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { LOCALES } from "@/lib/locale-config";
import { getTemplates, PresetTemplate } from "@/lib/scenario-api";

interface PresetTemplatesProps {
  onSelect: (template: PresetTemplate) => void;
  disabled?: boolean;
}

// Fallback templates if API is unavailable
const FALLBACK_TEMPLATES: PresetTemplate[] = [
  {
    id: "dutch-auto",
    name: "Dutch Auto Claim",
    locale: "NL",
    claim_type: "auto",
    complexity: "moderate",
    description: "Auto collision scenario in the Netherlands",
  },
  {
    id: "german-home",
    name: "German Home Insurance",
    locale: "DE",
    claim_type: "home",
    complexity: "simple",
    description: "Home insurance claim in Germany",
  },
  {
    id: "uk-health",
    name: "UK Health Emergency",
    locale: "UK",
    claim_type: "health",
    complexity: "moderate",
    description: "Health emergency claim in the UK",
  },
  {
    id: "us-auto",
    name: "US Auto Accident",
    locale: "US",
    claim_type: "auto",
    complexity: "complex",
    description: "Complex auto accident in the United States",
  },
  {
    id: "french-commercial",
    name: "French Commercial Claim",
    locale: "FR",
    claim_type: "commercial",
    complexity: "complex",
    description: "Commercial insurance claim in France",
  },
  {
    id: "japanese-life",
    name: "Japanese Life Insurance",
    locale: "JP",
    claim_type: "life",
    complexity: "simple",
    description: "Life insurance claim in Japan",
  },
];

export function PresetTemplates({ onSelect, disabled }: PresetTemplatesProps) {
  const [templates, setTemplates] = useState<PresetTemplate[]>(FALLBACK_TEMPLATES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTemplates() {
      try {
        const response = await getTemplates();
        if (response.templates.length > 0) {
          setTemplates(response.templates);
        }
      } catch (error) {
        // Use fallback templates on error
        console.warn("Failed to fetch templates, using fallback:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchTemplates();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Click a template to generate a scenario instantly with preset regional settings.
      </p>
      <div className="grid gap-2">
        {templates.map((template) => {
          const localeConfig = LOCALES[template.locale];
          return (
            <Card
              key={template.id}
              className={`cursor-pointer transition-colors hover:bg-accent ${
                disabled ? "opacity-50 pointer-events-none" : ""
              }`}
              onClick={() => !disabled && onSelect(template)}
            >
              <CardHeader className="p-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <span>{localeConfig.flag}</span>
                  <span>{template.name}</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  {template.description}
                </CardDescription>
              </CardHeader>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
