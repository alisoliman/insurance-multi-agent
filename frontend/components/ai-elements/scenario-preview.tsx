"use client"

/**
 * ScenarioPreview component - Feature 005 - US5 (T032-T035)
 * 
 * Provides presenter-friendly scenario management with:
 * - Expandable scenario details
 * - Locale flag icons
 * - Claim type badges with colors
 * - Complexity indicators
 * - Missing documentation hints as improvement opportunities
 */

import React, { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { 
  IconChevronDown, 
  IconChevronUp,
  IconAlertTriangle,
  IconCheck,
  IconX,
  IconMapPin,
  IconCalendar,
  IconCar,
  IconUser,
  IconFileText,
  IconPhoto,
  IconShieldCheck,
} from "@tabler/icons-react"
import { GeneratedScenario } from "@/lib/scenario-api"

// Locale flag emoji mapping (T033)
const LOCALE_FLAGS: Record<string, { flag: string; name: string }> = {
  "de-DE": { flag: "🇩🇪", name: "Germany" },
  "nl-NL": { flag: "🇳🇱", name: "Netherlands" },
  "en-UK": { flag: "🇬🇧", name: "United Kingdom" },
  "en-GB": { flag: "🇬🇧", name: "United Kingdom" },
  "en-US": { flag: "🇺🇸", name: "United States" },
  "fr-FR": { flag: "🇫🇷", name: "France" },
  "es-ES": { flag: "🇪🇸", name: "Spain" },
  "it-IT": { flag: "🇮🇹", name: "Italy" },
}

// Claim type colors (T034)
const CLAIM_TYPE_CONFIG: Record<string, { color: string; label: string }> = {
  "collision": { color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", label: "Collision" },
  "comprehensive": { color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", label: "Comprehensive" },
  "theft": { color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400", label: "Theft" },
  "vandalism": { color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400", label: "Vandalism" },
  "water_damage": { color: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400", label: "Water Damage" },
  "fire": { color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", label: "Fire" },
  "glass": { color: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400", label: "Glass" },
  // Localized claim types
  "aanrijding": { color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", label: "Aanrijding" },
  "diefstal": { color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400", label: "Diefstal" },
  "auffahrunfall": { color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400", label: "Auffahrunfall" },
  "parkschaden": { color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400", label: "Parkschaden" },
}

interface LocaleFlagProps {
  locale: string
  showLabel?: boolean
}

/**
 * Renders a locale flag emoji with tooltip (T033)
 */
export function LocaleFlag({ locale, showLabel = false }: LocaleFlagProps) {
  const localeInfo = LOCALE_FLAGS[locale] || { flag: "🌍", name: locale }
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="cursor-default text-lg" role="img" aria-label={localeInfo.name}>
            {localeInfo.flag}
            {showLabel && <span className="ml-1 text-xs">{locale}</span>}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p>{localeInfo.name}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

interface ClaimTypeBadgeProps {
  claimType: string
}

/**
 * Renders a colored claim type badge (T034)
 */
export function ClaimTypeBadge({ claimType }: ClaimTypeBadgeProps) {
  const normalizedType = claimType.toLowerCase().replace(/\s+/g, "_")
  const config = CLAIM_TYPE_CONFIG[normalizedType] || { 
    color: "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400", 
    label: claimType 
  }
  
  return (
    <Badge variant="outline" className={`text-xs ${config.color}`}>
      {config.label}
    </Badge>
  )
}

/**
 * Calculate scenario complexity based on factors (T034)
 */
export function calculateComplexity(scenario: GeneratedScenario): {
  level: "low" | "medium" | "high"
  factors: string[]
} {
  const factors: string[] = []
  let score = 0
  
  // Higher damage = more complex
  if (scenario.claim.estimated_damage > 10000) {
    score += 2
    factors.push("High damage amount")
  } else if (scenario.claim.estimated_damage > 5000) {
    score += 1
    factors.push("Moderate damage amount")
  }
  
  // Missing documentation = more complex for agents
  if (!scenario.claim.photos_provided) {
    score += 1
    factors.push("No photos")
  }
  if (!scenario.claim.police_report) {
    score += 1
    factors.push("No police report")
  }
  if (!scenario.claim.witness_statements || scenario.claim.witness_statements === "none") {
    score += 1
    factors.push("No witnesses")
  }
  
  // Complex claim types
  const complexTypes = ["theft", "diefstal", "fire", "vandalism"]
  if (complexTypes.includes(scenario.claim.claim_type.toLowerCase())) {
    score += 1
    factors.push("Complex claim type")
  }
  
  if (score >= 4) return { level: "high", factors }
  if (score >= 2) return { level: "medium", factors }
  return { level: "low", factors }
}

interface ComplexityBadgeProps {
  scenario: GeneratedScenario
}

/**
 * Renders a complexity indicator badge (T034)
 */
export function ComplexityBadge({ scenario }: ComplexityBadgeProps) {
  const { level, factors } = calculateComplexity(scenario)
  
  const config = {
    low: { 
      color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      label: "Simple",
      icon: IconCheck,
    },
    medium: { 
      color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
      label: "Moderate",
      icon: IconAlertTriangle,
    },
    high: { 
      color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      label: "Complex",
      icon: IconAlertTriangle,
    },
  }
  
  const { color, label, icon: Icon } = config[level]
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={`text-xs ${color}`}>
            <Icon className="h-3 w-3 mr-1" />
            {label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top">
          <div className="text-xs">
            <p className="font-medium mb-1">Complexity factors:</p>
            <ul className="list-disc list-inside">
              {factors.length > 0 ? (
                factors.map((f, i) => <li key={i}>{f}</li>)
              ) : (
                <li>Standard claim</li>
              )}
            </ul>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

interface DocumentationStatusProps {
  photosProvided?: boolean
  policeReport?: boolean
  witnessStatements?: string
}

/**
 * Shows documentation status with improvement opportunities (T035)
 */
export function DocumentationStatus({ 
  photosProvided, 
  policeReport, 
  witnessStatements 
}: DocumentationStatusProps) {
  const hasWitness = witnessStatements && witnessStatements !== "none"
  
  const items = [
    { label: "Photos", provided: photosProvided ?? false, icon: IconPhoto },
    { label: "Police Report", provided: policeReport ?? false, icon: IconFileText },
    { label: "Witnesses", provided: hasWitness, icon: IconUser },
  ]
  
  const missingCount = items.filter(i => !i.provided).length
  
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 flex-wrap">
        {items.map((item) => (
          <span 
            key={item.label}
            className={`inline-flex items-center gap-1 text-xs ${
              item.provided 
                ? "text-green-600 dark:text-green-400" 
                : "text-muted-foreground"
            }`}
          >
            {item.provided ? (
              <IconCheck className="h-3 w-3" />
            ) : (
              <IconX className="h-3 w-3 text-red-500" />
            )}
            {item.label}
          </span>
        ))}
      </div>
      {missingCount > 0 && (
        <p className="text-xs text-amber-600 dark:text-amber-400 italic">
          💡 Demo opportunity: Add {missingCount === 1 ? "missing document" : `${missingCount} missing documents`} to show different workflow paths
        </p>
      )}
    </div>
  )
}

interface ScenarioPreviewExpandedProps {
  scenario: GeneratedScenario
}

/**
 * Expanded scenario preview showing all data fields (T032)
 */
export function ScenarioPreviewExpanded({ scenario }: ScenarioPreviewExpandedProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full justify-between p-0 h-6">
          <span className="text-xs text-muted-foreground">
            {isOpen ? "Hide details" : "Show details"}
          </span>
          {isOpen ? (
            <IconChevronUp className="h-3 w-3" />
          ) : (
            <IconChevronDown className="h-3 w-3" />
          )}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 space-y-3">
        {/* Claim Info */}
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <IconFileText className="h-3 w-3" />
            <span className="font-medium">Claim:</span>
            <span>{scenario.claim.claim_id}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <IconShieldCheck className="h-3 w-3" />
            <span className="font-medium">Policy:</span>
            <span>{scenario.claim.policy_number}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <IconCalendar className="h-3 w-3" />
            <span className="font-medium">Date:</span>
            <span>{scenario.claim.incident_date}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <IconMapPin className="h-3 w-3" />
            <span className="font-medium">Location:</span>
            <span>{scenario.claim.location}</span>
          </div>
        </div>
        
        {/* Vehicle Info */}
        {scenario.claim.vehicle_info && (
          <div className="space-y-1 text-xs border-t pt-2">
            <div className="flex items-center gap-2 text-muted-foreground font-medium">
              <IconCar className="h-3 w-3" />
              Vehicle
            </div>
            <div className="pl-5 space-y-0.5 text-muted-foreground">
              <div>{scenario.claim.vehicle_info.make} {scenario.claim.vehicle_info.model} ({scenario.claim.vehicle_info.year})</div>
              <div>VIN: {scenario.claim.vehicle_info.vin}</div>
              <div>{scenario.claim.vehicle_info.mileage?.toLocaleString()} km</div>
            </div>
          </div>
        )}
        
        {/* Customer Info */}
        {scenario.claim.customer_info && (
          <div className="space-y-1 text-xs border-t pt-2">
            <div className="flex items-center gap-2 text-muted-foreground font-medium">
              <IconUser className="h-3 w-3" />
              Customer
            </div>
            <div className="pl-5 space-y-0.5 text-muted-foreground">
              <div>{scenario.claim.customer_info.email}</div>
              <div>{scenario.claim.customer_info.phone}</div>
              <div>{scenario.claim.customer_info.address}</div>
            </div>
          </div>
        )}
        
        {/* Documentation Status */}
        <div className="border-t pt-2">
          <DocumentationStatus
            photosProvided={scenario.claim.photos_provided}
            policeReport={scenario.claim.police_report}
            witnessStatements={scenario.claim.witness_statements}
          />
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

export {
  LOCALE_FLAGS,
  CLAIM_TYPE_CONFIG,
}
