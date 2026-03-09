"use client"

import { BriefcaseBusiness, Radar } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

import { personaViews } from "../slide-data"
import type { SlideProps } from "../slide-shared"
import { SectionHeading, SlideFitFrame } from "../slide-shared"

export function WorkbenchSlide({ isCompact, isShort }: SlideProps) {
  return (
    <SlideFitFrame>
      <div className="flex flex-col gap-5 pb-4">
        <SectionHeading
          eyebrow="Workbench"
          title="One platform. Four operating views."
          description={
            isShort
              ? undefined
              : "The workbench re-composes around each persona — handlers, leads, compliance, and sponsors each see the orchestration they need."
          }
          compact={isCompact}
        />

        <Tabs defaultValue={personaViews[0].id} className="flex flex-1 flex-col gap-4">
          <TabsList className="h-auto w-full flex-wrap justify-start gap-1.5 rounded-[1.35rem] border border-white/8 bg-white/6 p-1.5">
            {personaViews.map((persona) => (
              <TabsTrigger
                key={persona.id}
                value={persona.id}
                className="cursor-pointer rounded-[1rem] px-3 py-1.5 text-sm text-[#e9edf2] data-[state=active]:bg-[#fff1de] data-[state=active]:text-[#152133] dark:data-[state=active]:bg-[#fff1de] dark:data-[state=active]:text-[#152133]"
              >
                {persona.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {personaViews.map((persona) => (
            <TabsContent key={persona.id} value={persona.id} className="flex-1">
              <div className="grid h-full gap-4 lg:grid-cols-[0.92fr_1.08fr]">
                <Card className="border-white/10 bg-white/6 text-white shadow-[0_24px_90px_rgba(0,0,0,0.28)]">
                  <CardHeader className={cn(isCompact && "space-y-2 pb-3")}>
                    <CardTitle className={cn("font-[family:var(--font-fraunces)] text-4xl text-[#fff7ec]", isCompact && "text-[2rem]")}>
                      {persona.title}
                    </CardTitle>
                    <CardDescription className={cn("text-base leading-7 text-[#d1d7df]", isCompact && "text-sm leading-6")}>
                      {persona.summary}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4 md:grid-cols-2">
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.3em] text-[#f5c483]">What this persona sees</div>
                      <div className="mt-3 grid gap-2">
                        {persona.lenses.map((lens) => (
                          <div key={lens} className={cn("flex min-h-[3.2rem] items-center rounded-2xl border border-white/8 bg-black/18 px-4 py-3 text-[15px] leading-6 text-[#edf1f5]", isCompact && "min-h-0 py-2 text-sm")}>
                            {lens}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.3em] text-[#95f2df]">Workbench composition</div>
                      <div className="mt-3 grid gap-2">
                        {persona.panels.map((panel) => (
                          <div key={panel} className={cn("flex min-h-[3.2rem] items-center rounded-2xl border border-white/8 bg-white/6 px-4 py-3 text-[15px] leading-6 text-[#edf1f5]", isCompact && "min-h-0 py-2 text-sm")}>
                            {panel}
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex flex-col rounded-[2rem] border border-white/10 bg-[#09131f]/78 p-4 shadow-[0_34px_120px_rgba(0,0,0,0.32)] backdrop-blur">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.3em] text-[#9fb0c4]">
                        Persona lens
                      </div>
                      <div className="mt-1 text-[14px] leading-5 text-[#d1d7df]">
                        How the same platform re-composes around a role.
                      </div>
                    </div>
                    <Badge className="border-white/10 bg-white/8 text-[#fff7ec]">
                      {persona.label}
                    </Badge>
                  </div>

                  <div className="grid flex-1 gap-3 md:grid-cols-[1.1fr_0.9fr]">
                    <div className="rounded-[1.5rem] border border-white/8 bg-white/7 p-4">
                      <div className="flex items-center gap-3">
                        <BriefcaseBusiness className="size-5 text-[#95f2df]" />
                        <div className="text-sm font-medium text-[#fff7ec]">Primary view</div>
                      </div>
                      <div className="mt-3 grid gap-2">
                        {persona.panels.map((panel, index) => (
                          <div
                            key={panel}
                            className={cn(
                              "flex min-h-[3.2rem] items-center rounded-2xl border px-4 py-3 text-[15px] leading-6",
                              isCompact && "min-h-0 py-2 text-sm",
                              index === 0
                                ? "border-[#95f2df]/30 bg-[#95f2df]/10 text-[#effcf8]"
                                : "border-white/8 bg-black/18 text-[#d1d7df]"
                            )}
                          >
                            {panel}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-[1.5rem] border border-white/8 bg-white/7 p-4">
                      <div className="flex items-center gap-3">
                        <Radar className="size-5 text-[#8ecbff]" />
                        <div className="text-sm font-medium text-[#fff7ec]">Signals surfaced</div>
                      </div>
                      <div className="mt-3 grid gap-2">
                        {persona.lenses.map((lens) => (
                          <div key={lens} className={cn("flex min-h-[3.2rem] items-center rounded-2xl border border-white/8 bg-black/16 px-4 py-3 text-[15px] leading-6 text-[#eaf0f5]", isCompact && "min-h-0 py-2 text-sm")}>
                            {lens}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </SlideFitFrame>
  )
}
