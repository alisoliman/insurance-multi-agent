"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, RefreshCw, FolderOpen } from "lucide-react";
import {
  listScenarios,
  getScenario,
  SavedScenarioSummary,
  GeneratedScenario,
  getErrorMessage,
} from "@/lib/scenario-api";
import { ScenarioGeneratorModal } from "@/components/scenario-generator";
import { formatCurrency, getLocaleConfig } from "@/lib/locale-config";

// Full claim data for agent/workflow APIs
export interface FullClaimData {
  claim_id: string;
  policy_number: string;
  claimant_id: string;
  claimant_name: string;
  incident_date: string;
  claim_type: string;
  description: string;
  estimated_damage: number;
  location: string;
  police_report: boolean;
  photos_provided: boolean;
  witness_statements: string;
  vehicle_info?: Record<string, unknown>;
  customer_info?: Record<string, unknown>;
}

interface ScenarioSelectorProps {
  onSelectScenario: (claim: FullClaimData) => void;
  disabled?: boolean;
  compact?: boolean;
}

/**
 * Shared component for selecting generated/saved scenarios across agent demos.
 * Shows both freshly generated scenarios and saved scenarios from the database.
 */
export function ScenarioSelector({
  onSelectScenario,
  disabled = false,
  compact = false,
}: ScenarioSelectorProps) {
  const [generatedScenarios, setGeneratedScenarios] = useState<GeneratedScenario[]>([]);
  const [savedScenarios, setSavedScenarios] = useState<SavedScenarioSummary[]>([]);
  const [isLoadingSaved, setIsLoadingSaved] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch saved scenarios on mount
  useEffect(() => {
    fetchSavedScenarios();
  }, []);

  const fetchSavedScenarios = async () => {
    setIsLoadingSaved(true);
    setError(null);
    try {
      const response = await listScenarios({ limit: 20 });
      setSavedScenarios(response.scenarios);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoadingSaved(false);
    }
  };

  const handleScenarioGenerated = (scenario: GeneratedScenario) => {
    setGeneratedScenarios((prev) => [scenario, ...prev]);
  };

  const handleSelectGenerated = (scenario: GeneratedScenario) => {
    const claim: FullClaimData = {
      claim_id: scenario.claim.claim_id,
      policy_number: scenario.claim.policy_number,
      claimant_id: scenario.claim.claimant_id,
      claimant_name: scenario.claim.claimant_name,
      incident_date: scenario.claim.incident_date,
      claim_type: scenario.claim.claim_type,
      description: scenario.claim.description,
      estimated_damage: scenario.claim.estimated_damage,
      location: scenario.claim.location,
      police_report: scenario.claim.police_report,
      photos_provided: scenario.claim.photos_provided,
      witness_statements: scenario.claim.witness_statements,
      vehicle_info: scenario.claim.vehicle_info as Record<string, unknown> | undefined,
      customer_info: scenario.claim.customer_info as Record<string, unknown> | undefined,
    };
    onSelectScenario(claim);
  };

  const handleSelectSaved = async (summary: SavedScenarioSummary) => {
    try {
      const fullScenario = await getScenario(summary.id);
      const claim: FullClaimData = {
        claim_id: fullScenario.claim.claim_id,
        policy_number: fullScenario.claim.policy_number,
        claimant_id: fullScenario.claim.claimant_id,
        claimant_name: fullScenario.claim.claimant_name,
        incident_date: fullScenario.claim.incident_date,
        claim_type: fullScenario.claim.claim_type,
        description: fullScenario.claim.description,
        estimated_damage: fullScenario.claim.estimated_damage,
        location: fullScenario.claim.location,
        police_report: fullScenario.claim.police_report,
        photos_provided: fullScenario.claim.photos_provided,
        witness_statements: fullScenario.claim.witness_statements,
        vehicle_info: fullScenario.claim.vehicle_info as Record<string, unknown> | undefined,
        customer_info: fullScenario.claim.customer_info as Record<string, unknown> | undefined,
      };
      onSelectScenario(claim);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const hasScenarios = generatedScenarios.length > 0 || savedScenarios.length > 0;

  if (compact) {
    // Compact mode: just show the generator button and a dropdown/selection
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <ScenarioGeneratorModal
            onScenarioGenerated={handleScenarioGenerated}
            trigger={
              <Button variant="outline" size="sm" disabled={disabled}>
                <Sparkles className="h-4 w-4 mr-1" />
                Generate
              </Button>
            }
          />
          {generatedScenarios.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {generatedScenarios.length} generated
            </Badge>
          )}
        </div>
        {generatedScenarios.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {generatedScenarios.slice(0, 3).map((s) => (
              <Button
                key={s.id}
                variant="ghost"
                size="sm"
                className="text-xs h-7"
                onClick={() => handleSelectGenerated(s)}
                disabled={disabled}
              >
                {s.name.slice(0, 20)}...
              </Button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Full mode: show cards for generated and saved scenarios
  return (
    <div className="space-y-4">
      {/* Generator Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-purple-500" />
          <span className="text-sm font-medium">AI-Generated Scenarios</span>
        </div>
        <ScenarioGeneratorModal
          onScenarioGenerated={handleScenarioGenerated}
          trigger={
            <Button variant="outline" size="sm" disabled={disabled}>
              <Sparkles className="h-4 w-4 mr-1" />
              Generate New
            </Button>
          }
        />
      </div>

      {/* Generated Scenarios */}
      {generatedScenarios.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2">
          {generatedScenarios.map((scenario) => {
            const localeConfig = getLocaleConfig(scenario.locale);
            return (
              <Card
                key={scenario.id}
                className="cursor-pointer hover:shadow-md transition-shadow border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-900/10"
                onClick={() => !disabled && handleSelectGenerated(scenario)}
              >
                <CardHeader className="py-2 px-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-medium truncate">
                      {scenario.name}
                    </CardTitle>
                    <span className="text-sm">{localeConfig.flag}</span>
                  </div>
                </CardHeader>
                <CardContent className="py-1 px-3 pb-2">
                  <div className="flex items-center justify-between text-xs">
                    <Badge variant="outline" className="text-[10px]">
                      {scenario.claim.claim_type}
                    </Badge>
                    <span className="font-medium text-green-600 dark:text-green-400">
                      {formatCurrency(scenario.claim.estimated_damage, scenario.locale)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Saved Scenarios */}
      {isLoadingSaved ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="ml-2 text-xs text-muted-foreground">Loading saved...</span>
        </div>
      ) : savedScenarios.length > 0 ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              Saved Scenarios ({savedScenarios.length})
            </span>
            <Button variant="ghost" size="sm" onClick={fetchSavedScenarios}>
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {savedScenarios.slice(0, 6).map((summary) => {
              const localeConfig = getLocaleConfig(summary.locale);
              return (
                <Card
                  key={summary.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => !disabled && handleSelectSaved(summary)}
                >
                  <CardHeader className="py-2 px-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xs font-medium truncate">
                        {summary.name}
                      </CardTitle>
                      <span className="text-sm">{localeConfig.flag}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="py-1 px-3 pb-2">
                    <div className="flex items-center justify-between text-xs">
                      <Badge variant="outline" className="text-[10px]">
                        {summary.claim_type}
                      </Badge>
                      <span className="font-medium text-green-600 dark:text-green-400">
                        {formatCurrency(summary.estimated_damage, summary.locale)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ) : !hasScenarios ? (
        <div className="flex flex-col items-center justify-center py-4 text-center">
          <FolderOpen className="h-8 w-8 text-muted-foreground/50 mb-2" />
          <p className="text-xs text-muted-foreground">
            No scenarios yet. Generate one to test with this agent.
          </p>
        </div>
      ) : null}

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}
