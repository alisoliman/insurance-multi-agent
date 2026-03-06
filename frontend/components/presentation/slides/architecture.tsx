"use client"

import { useState } from "react"

import type { SlideProps } from "../slide-shared"
import { ArchitectureDiagram, SectionHeading, SlideFitFrame } from "../slide-shared"

export function ArchitectureSlide({ isCompact, isShort }: SlideProps) {
  const [activeNode, setActiveNode] = useState("backend")

  return (
    <SlideFitFrame>
      <div className="flex flex-col gap-6 pb-4">
        <SectionHeading
          eyebrow="Architecture"
          title={
            isShort
              ? "Public experience. Private data. Shared trust."
              : "Before meeting the agents — see where they live."
          }
          description={
            isShort
              ? "Container Apps runs the experience, PostgreSQL stays private, identity is shared, Azure OpenAI is an explicit external dependency."
              : "The live Azure deployment: public conversation surfaces on Container Apps, a private PostgreSQL path inside the VNet, a shared delivery identity, and an external Azure OpenAI dependency kept explicit."
          }
          compact={isCompact}
        />
        <ArchitectureDiagram
          activeNodeId={activeNode}
          onSelect={setActiveNode}
          compact={isCompact}
        />
      </div>
    </SlideFitFrame>
  )
}
