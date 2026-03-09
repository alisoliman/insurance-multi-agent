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
import { SectionHeading } from "../slide-shared"

export function WorkbenchSlide() {
  return (
    <div className="flex flex-col gap-3">
      <SectionHeading
        eyebrow="Workbench"
        title="One platform. Four operating views."
        description="The workbench re-composes around each persona — handlers, leads, compliance, and sponsors each see the orchestration they need."
      />

      <Tabs defaultValue={personaViews[0].id} className="flex flex-1 flex-col gap-3">
        <TabsList className="h-auto w-full flex-wrap justify-start gap-1.5 rounded-2xl border border-white/8 bg-white/6 p-1.5">
          {personaViews.map((persona) => (
            <TabsTrigger
              key={persona.id}
              value={persona.id}
              className="cursor-pointer rounded-xl px-3 py-1.5 text-sm text-[#e9edf2] data-[state=active]:bg-[#fff1de] data-[state=active]:text-[#152133] dark:data-[state=active]:bg-[#fff1de] dark:data-[state=active]:text-[#152133]"
            >
              {persona.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {personaViews.map((persona) => (
          <TabsContent key={persona.id} value={persona.id} className="flex-1">
            <div className="grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
              <Card className="border-white/10 bg-white/6 text-white shadow-lg">
                <CardHeader>
                  <CardTitle className="font-[family:var(--font-fraunces)] text-2xl text-[#fff7ec] lg:text-3xl">
                    {persona.title}
                  </CardTitle>
                  <CardDescription className="text-sm leading-relaxed text-[#d1d7df] lg:text-base">
                    {persona.summary}
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.3em] text-[#f5c483]">What this persona sees</div>
                    <div className="mt-3 grid gap-2">
                      {persona.lenses.map((lens) => (
                        <div key={lens} className="rounded-2xl border border-white/8 bg-black/18 px-4 py-2 text-sm leading-relaxed text-[#edf1f5]">
                          {lens}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.3em] text-[#95f2df]">Workbench composition</div>
                    <div className="mt-3 grid gap-2">
                      {persona.panels.map((panel) => (
                        <div key={panel} className="rounded-2xl border border-white/8 bg-white/6 px-4 py-2 text-sm leading-relaxed text-[#edf1f5]">
                          {panel}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex flex-col rounded-2xl border border-white/10 bg-[#09131f]/78 p-4 shadow-lg backdrop-blur">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] uppercase tracking-[0.3em] text-[#9fb0c4]">
                      Persona lens
                    </div>
                    <div className="mt-1 text-sm leading-5 text-[#d1d7df]">
                      How the same platform re-composes around a role.
                    </div>
                  </div>
                  <Badge className="border-white/10 bg-white/8 text-[#fff7ec]">
                    {persona.label}
                  </Badge>
                </div>

                <div className="grid flex-1 gap-3 md:grid-cols-[1.1fr_0.9fr]">
                  <div className="rounded-2xl border border-white/8 bg-white/7 p-4">
                    <div className="flex items-center gap-3">
                      <BriefcaseBusiness className="size-5 text-[#95f2df]" />
                      <div className="text-sm font-medium text-[#fff7ec]">Primary view</div>
                    </div>
                    <div className="mt-3 grid gap-2">
                      {persona.panels.map((panel, index) => (
                        <div
                          key={panel}
                          className={cn(
                            "rounded-2xl border px-4 py-2 text-sm leading-relaxed",
                            index === 0
                              ? "border-[#95f2df]/30 bg-[#95f2df]/10 text-[#effcf8]"
                              : "border-white/8 bg-black/18 text-[#d1d7df]",
                          )}
                        >
                          {panel}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/8 bg-white/7 p-4">
                    <div className="flex items-center gap-3">
                      <Radar className="size-5 text-[#8ecbff]" />
                      <div className="text-sm font-medium text-[#fff7ec]">Signals surfaced</div>
                    </div>
                    <div className="mt-3 grid gap-2">
                      {persona.lenses.map((lens) => (
                        <div key={lens} className="rounded-2xl border border-white/8 bg-black/16 px-4 py-2 text-sm leading-relaxed text-[#eaf0f5]">
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
  )
}
