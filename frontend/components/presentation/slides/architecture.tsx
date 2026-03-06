"use client"

import { useState } from "react"

import type { SlideProps } from "../slide-shared"
import { ArchitectureDiagram, SectionHeading, SlideScrollArea } from "../slide-shared"

export function ArchitectureSlide({ isCompact, isShort }: SlideProps) {
  const [activeNode, setActiveNode] = useState("backend")

  return (
    <SlideScrollArea>
      <div className="flex min-h-full flex-col gap-6 pb-8">
        <SectionHeading
          eyebrow="Architecture"
          title={
            isShort
              ? "Public experience, private claims data, shared delivery."
              : "Before meeting the agents, see where they live."
          }
          description={
            isShort
              ? "Container Apps handles the experience, PostgreSQL stays private, identity stays shared, and Azure OpenAI remains an explicit external dependency."
              : "This is the live Azure deployment: public conversation surfaces on Container Apps, a private PostgreSQL path inside the VNet, a shared delivery identity, and an external Azure OpenAI dependency kept explicit."
          }
          compact={isCompact}
        />
        <ArchitectureDiagram
          activeNodeId={activeNode}
          onSelect={setActiveNode}
          compact={isCompact}
        />
      </div>
    </SlideScrollArea>
  )
}
