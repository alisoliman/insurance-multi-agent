"use client";

import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { Loader2, FolderOpen, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { ScenarioCard } from "./scenario-card";
import {
  SavedScenarioSummary,
  listScenarios,
  deleteScenario,
  getErrorMessage,
} from "@/lib/scenario-api";

interface SavedScenariosListProps {
  onUseScenario: (scenario: SavedScenarioSummary) => void;
  refreshTrigger?: number; // Increment to trigger a refresh
}

export function SavedScenariosList({
  onUseScenario,
  refreshTrigger = 0,
}: SavedScenariosListProps) {
  const [scenarios, setScenarios] = useState<SavedScenarioSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  const fetchScenarios = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await listScenarios({ limit: 50 });
      setScenarios(response.scenarios);
      setTotal(response.total);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch on mount and when refreshTrigger changes
  useEffect(() => {
    fetchScenarios();
  }, [fetchScenarios, refreshTrigger]);

  const handleDelete = async (scenarioId: string) => {
    setIsDeleting(scenarioId);

    try {
      await deleteScenario(scenarioId);
      // Remove from local state
      setScenarios((prev) => prev.filter((s) => s.id !== scenarioId));
      setTotal((prev) => prev - 1);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsDeleting(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">
          Loading saved scenarios...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription className="flex items-center justify-between">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={fetchScenarios}>
            <RefreshCw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (scenarios.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <FolderOpen className="h-12 w-12 text-muted-foreground/50 mb-3" />
        <h3 className="text-sm font-medium text-muted-foreground">
          No Saved Scenarios
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Generate and save scenarios to reuse them later
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {total} saved scenario{total !== 1 ? "s" : ""}
        </p>
        <Button variant="ghost" size="sm" onClick={fetchScenarios}>
          <RefreshCw className="h-3 w-3 mr-1" />
          Refresh
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {scenarios.map((scenario) => (
          <ScenarioCard
            key={scenario.id}
            scenario={scenario}
            onUse={onUseScenario}
            onDelete={handleDelete}
            isDeleting={isDeleting === scenario.id}
          />
        ))}
      </div>
    </div>
  );
}
