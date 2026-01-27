"use client";

import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Camera, CheckCircle2, FileText, Info } from "lucide-react";
import { memo } from "react";

/**
 * Documentation hint types for claim assessment.
 * Used to educate presenters and viewers about what documentation helps claims.
 */
export type DocumentationHintType =
  | "missing_photos"
  | "missing_police_report"
  | "missing_witnesses"
  | "photos_provided"
  | "complete_documentation";

export interface DocumentationHintProps {
  /** Type of documentation hint to display */
  type: DocumentationHintType;
  /** Whether photos were provided */
  photosProvided?: boolean;
  /** Number of photos if provided */
  photoCount?: number;
  /** Whether a police report was filed */
  policeReport?: boolean;
  /** Witness statements status */
  witnessStatements?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Generic documentation hints that don't reveal claim outcome.
 * These are educational tips about what documentation helps claims.
 */
const DOCUMENTATION_HINTS: Record<DocumentationHintType, { message: string; tooltip: string }> = {
  missing_photos: {
    message: "No photos",
    tooltip: "Adding photos of damage typically increases claim processing speed and approval likelihood.",
  },
  missing_police_report: {
    message: "No police report",
    tooltip: "For accidents involving other parties, a police report can strengthen the claim documentation.",
  },
  missing_witnesses: {
    message: "No witnesses",
    tooltip: "Witness statements can provide additional context that helps claim assessment.",
  },
  photos_provided: {
    message: "Photos analyzed",
    tooltip: "Photo documentation has been submitted and will be reviewed as part of the claim assessment.",
  },
  complete_documentation: {
    message: "Complete docs",
    tooltip: "This claim has comprehensive documentation including photos, police report, and witness statements.",
  },
};

/**
 * DocumentationHint component for claim assessor UI.
 * 
 * Displays subtle, non-intrusive hints about documentation status.
 * Uses Badge + Tooltip pattern following shadcn/ui conventions.
 * 
 * Design principles:
 * - Generic hints that don't reveal claim outcome
 * - Educational value for presenters and viewers
 * - Muted colors that don't distract from main content
 * - Accessible tooltips with detailed explanations
 */
function DocumentationHintComponent({
  type,
  // These props are available for future conditional rendering:
  // photosProvided, policeReport, witnessStatements
  photoCount,
  className,
}: DocumentationHintProps) {
  const hint = DOCUMENTATION_HINTS[type];
  
  // Determine icon and variant based on type
  const getIconAndVariant = () => {
    switch (type) {
      case "missing_photos":
        return {
          icon: <Camera className="h-3 w-3 mr-1" />,
          variant: "outline" as const,
        };
      case "missing_police_report":
        return {
          icon: <FileText className="h-3 w-3 mr-1" />,
          variant: "outline" as const,
        };
      case "missing_witnesses":
        return {
          icon: <Info className="h-3 w-3 mr-1" />,
          variant: "outline" as const,
        };
      case "photos_provided":
        return {
          icon: <CheckCircle2 className="h-3 w-3 mr-1" />,
          variant: "secondary" as const,
        };
      case "complete_documentation":
        return {
          icon: <CheckCircle2 className="h-3 w-3 mr-1" />,
          variant: "secondary" as const,
        };
      default:
        return {
          icon: <AlertCircle className="h-3 w-3 mr-1" />,
          variant: "outline" as const,
        };
    }
  };

  const { icon, variant } = getIconAndVariant();
  
  // Build display message
  let displayMessage = hint.message;
  if (type === "photos_provided" && photoCount) {
    displayMessage = `📸 ${photoCount} photos analyzed`;
  }

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant={variant}
            className={cn(
              "cursor-help text-xs font-normal",
              // Muted colors for non-intrusive display
              type.startsWith("missing_") && "text-muted-foreground border-muted-foreground/40",
              (type === "photos_provided" || type === "complete_documentation") && 
                "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800",
              className
            )}
          >
            {icon}
            {displayMessage}
          </Badge>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-xs text-sm"
        >
          {hint.tooltip}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Memoized version for performance in lists.
 */
export const DocumentationHint = memo(DocumentationHintComponent);

/**
 * Helper function to determine which hint to show based on claim data.
 */
export function getDocumentationHintType(
  photosProvided: boolean,
  policeReport: boolean,
  witnessStatements: string
): DocumentationHintType {
  const hasWitnesses = witnessStatements && witnessStatements !== "none" && witnessStatements !== "0";
  
  // Check for complete documentation
  if (photosProvided && policeReport && hasWitnesses) {
    return "complete_documentation";
  }
  
  // Check for photos provided (positive acknowledgment)
  if (photosProvided) {
    return "photos_provided";
  }
  
  // Show most impactful missing documentation first
  if (!photosProvided) {
    return "missing_photos";
  }
  
  if (!policeReport) {
    return "missing_police_report";
  }
  
  if (!hasWitnesses) {
    return "missing_witnesses";
  }
  
  return "photos_provided"; // Default fallback
}

export default DocumentationHint;
