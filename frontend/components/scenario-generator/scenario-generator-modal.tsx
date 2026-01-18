"use client";

import * as React from "react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Sparkles, AlertCircle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { LocaleSelector } from "./locale-selector";
import { ClaimTypeSelector } from "./claim-type-selector";
import { ComplexitySelector } from "./complexity-selector";
import { CustomDescriptionInput } from "./custom-description-input";
import { PresetTemplates } from "./preset-templates";

import { Locale, ClaimType, Complexity } from "@/lib/locale-config";
import {
  generateScenario,
  GeneratedScenario,
  getErrorMessage,
  PresetTemplate,
} from "@/lib/scenario-api";

interface ScenarioGeneratorModalProps {
  onScenarioGenerated: (scenario: GeneratedScenario) => void;
  trigger?: React.ReactNode;
}

export function ScenarioGeneratorModal({
  onScenarioGenerated,
  trigger,
}: ScenarioGeneratorModalProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"quick" | "custom" | "templates">("quick");
  
  // Form state
  const [locale, setLocale] = useState<Locale>("US");
  const [claimType, setClaimType] = useState<ClaimType>("auto");
  const [complexity, setComplexity] = useState<Complexity>("moderate");
  const [customDescription, setCustomDescription] = useState("");
  
  // UI state
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const scenario = await generateScenario({
        locale,
        claim_type: claimType,
        complexity,
      });

      onScenarioGenerated(scenario);
      setOpen(false);
      resetForm();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCustomGenerate = async () => {
    if (!customDescription.trim()) {
      setError("Please enter a description for your scenario");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const scenario = await generateScenario({
        locale,
        custom_description: customDescription,
      });

      onScenarioGenerated(scenario);
      setOpen(false);
      resetForm();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTemplateSelect = async (template: PresetTemplate) => {
    setIsGenerating(true);
    setError(null);

    try {
      const scenario = await generateScenario({
        locale: template.locale,
        claim_type: template.claim_type,
        complexity: template.complexity,
      });

      onScenarioGenerated(scenario);
      setOpen(false);
      resetForm();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsGenerating(false);
    }
  };

  const resetForm = () => {
    setLocale("US");
    setClaimType("auto");
    setComplexity("moderate");
    setCustomDescription("");
    setError(null);
  };

  const handleRetry = () => {
    setError(null);
    if (activeTab === "custom") {
      handleCustomGenerate();
    } else {
      handleGenerate();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Generate New Scenario
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Generate Demo Scenario
          </DialogTitle>
          <DialogDescription>
            Create a realistic insurance claim scenario using AI. Choose from preset options or describe your own scenario.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Generation Failed</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>{error}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetry}
                disabled={isGenerating}
                className="ml-2"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="quick">Quick Generate</TabsTrigger>
            <TabsTrigger value="custom">Custom</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
          </TabsList>

          <TabsContent value="quick" className="space-y-4 mt-4">
            <LocaleSelector
              value={locale}
              onChange={setLocale}
              disabled={isGenerating}
            />
            <ClaimTypeSelector
              value={claimType}
              onChange={setClaimType}
              disabled={isGenerating}
            />
            <ComplexitySelector
              value={complexity}
              onChange={setComplexity}
              disabled={isGenerating}
            />
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Scenario
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="custom" className="space-y-4 mt-4">
            <LocaleSelector
              value={locale}
              onChange={setLocale}
              disabled={isGenerating}
            />
            <CustomDescriptionInput
              value={customDescription}
              onChange={setCustomDescription}
              disabled={isGenerating}
            />
            <Button
              onClick={handleCustomGenerate}
              disabled={isGenerating || !customDescription.trim()}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate from Description
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="templates" className="mt-4">
            <PresetTemplates
              onSelect={handleTemplateSelect}
              disabled={isGenerating}
            />
            {isGenerating && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">
                  Generating scenario...
                </span>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
