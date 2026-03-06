"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

import { closeProofPoints, closeQuestions } from "../slide-data"
import type { SlideProps } from "../slide-shared"
import { SectionHeading, SlideScrollArea } from "../slide-shared"

export function CloseSlide({
  isCompact,
  onRestart,
}: Omit<SlideProps, "isShort"> & { onRestart: () => void }) {
  return (
    <SlideScrollArea>
      <div className="grid min-h-full gap-6 pb-8 lg:grid-cols-[1.08fr_0.92fr]">
        <div className="space-y-6">
          <SectionHeading
            eyebrow="Conversation starter"
            title="The real question isn't whether agents can help with claims. It's what kind of claims organization you want to become."
            description="This deck opens that conversation. The platform already shows how explainable specialist agents, private-by-design data access, and persona-aware workbenches coexist inside one operating model. The next step is choosing how far to push it."
            compact={isCompact}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            {closeQuestions.map((question) => (
              <div key={question} className="rounded-[1.5rem] border border-white/10 bg-white/6 px-4 py-3 text-sm leading-6 text-[#edf1f5]">
                {question}
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              size="lg"
              asChild
              className="rounded-full bg-[#fff2e1] px-6 text-[#172333] hover:bg-[#ffe3c1]"
            >
              <Link href="/">
                Enter the live workbench
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="rounded-full border-white/15 bg-white/5 px-6 text-[#fff7ec] hover:bg-white/10 hover:text-[#fff7ec]"
              onClick={onRestart}
            >
              Restart presentation
            </Button>
          </div>
        </div>

        <Card className="border-white/10 bg-white/7 text-white shadow-[0_34px_110px_rgba(0,0,0,0.32)] backdrop-blur">
          <CardHeader className={cn(isCompact && "space-y-2 pb-3")}>
            <CardTitle className={cn("font-[family:var(--font-fraunces)] text-4xl text-[#fff7ec]", isCompact && "text-[2.25rem]")}>
              What the platform already proves
            </CardTitle>
            <CardDescription className={cn("text-base leading-7 text-[#d2d7df]", isCompact && "text-sm leading-6")}>
              More than a concept deck — a working product with a narrative layer built into it.
            </CardDescription>
          </CardHeader>
          <CardContent className={cn("space-y-4", isCompact && "space-y-3 pt-0")}>
            {closeProofPoints.map((item) => (
              <div key={item.title} className="rounded-[1.45rem] border border-white/8 bg-black/18 px-4 py-3.5">
                <div className="flex items-start gap-3">
                  <item.icon className="mt-0.5 size-5 text-[#95f2df]" />
                  <div>
                    <div className="text-sm font-medium text-[#fff7ec]">{item.title}</div>
                    <div className="mt-1 text-sm leading-6 text-[#d3d8df]">{item.copy}</div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </SlideScrollArea>
  )
}
