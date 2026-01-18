"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Car,
  Home,
  Heart,
  Shield,
  Building2,
  Trash2,
  Play,
  Clock,
  MapPin,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { SavedScenarioSummary } from "@/lib/scenario-api";
import { ClaimType, getLocaleConfig, formatCurrency } from "@/lib/locale-config";

interface ScenarioCardProps {
  scenario: SavedScenarioSummary;
  onUse: (scenario: SavedScenarioSummary) => void;
  onDelete: (scenarioId: string) => void;
  isDeleting?: boolean;
}

const claimTypeIcons: Record<ClaimType, React.ReactNode> = {
  auto: <Car className="h-4 w-4" />,
  home: <Home className="h-4 w-4" />,
  health: <Heart className="h-4 w-4" />,
  life: <Shield className="h-4 w-4" />,
  commercial: <Building2 className="h-4 w-4" />,
};

const claimTypeColors: Record<ClaimType, string> = {
  auto: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  home: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
  health: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  life: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  commercial: "bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-300",
};

const complexityColors = {
  simple: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  moderate: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  complex: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function ScenarioCard({
  scenario,
  onUse,
  onDelete,
  isDeleting = false,
}: ScenarioCardProps) {
  const localeConfig = getLocaleConfig(scenario.locale);

  return (
    <Card className="relative overflow-hidden hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base font-medium line-clamp-1">
            {scenario.name}
          </CardTitle>
          <span className="text-lg shrink-0" title={localeConfig.name}>
            {localeConfig.flag}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          <Badge
            variant="secondary"
            className={`text-xs ${claimTypeColors[scenario.claim_type]}`}
          >
            {claimTypeIcons[scenario.claim_type]}
            <span className="ml-1 capitalize">{scenario.claim_type}</span>
          </Badge>
          <Badge
            variant="secondary"
            className={`text-xs capitalize ${complexityColors[scenario.complexity]}`}
          >
            {scenario.complexity}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-lg font-semibold">
          {formatCurrency(scenario.estimated_damage, scenario.locale)}
        </div>

        <div className="flex items-center text-xs text-muted-foreground gap-4">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDate(scenario.created_at)}
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            {localeConfig.name}
          </span>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            variant="default"
            size="sm"
            className="flex-1"
            onClick={() => onUse(scenario)}
          >
            <Play className="h-3 w-3 mr-1" />
            Use
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive"
                disabled={isDeleting}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Scenario?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete &quot;{scenario.name}&quot;. This
                  action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(scenario.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
