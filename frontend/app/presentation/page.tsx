import { Suspense } from "react"
import type { Metadata } from "next"

import { PlatformStoryDeck } from "@/components/presentation/platform-story-deck"

export const metadata: Metadata = {
  title: "Platform Presentation",
  description: "Interactive presentation for the Simple Insurance Multi-Agent platform.",
}

export default function PresentationPage() {
  return (
    <Suspense fallback={null}>
      <PlatformStoryDeck />
    </Suspense>
  )
}
