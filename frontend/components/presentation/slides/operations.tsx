"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

import { repetitiveWorkstreams, organizationPressures } from "../slide-data"
import type { SlideProps } from "../slide-shared"
import { SectionHeading, SlideScrollArea } from "../slide-shared"

export function OperationsSlide({ isCompact }: SlideProps) {
  return (
    <SlideScrollArea>
      <div className="flex min-h-full flex-col gap-6 pb-8">
        <SectionHeading
          eyebrow="Repetitive work"
          title="Claims teams aren't blocked by a lack of judgment. They're blocked by the work required before judgment can happen."
          description="Status chasing, document loops, context stitching, and reconstruction work turn skilled people into the integration layer for the process."
          compact={isCompact}
        />

        <div className="grid flex-1 gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <Card className="border-white/10 bg-white/6 text-white shadow-[0_24px_90px_rgba(0,0,0,0.28)] backdrop-blur">
            <CardHeader className={cn(isCompact && "space-y-2 pb-3")}>
              <CardTitle className={cn("font-[family:var(--font-fraunces)] text-[2.4rem] text-[#fff7ec]", isCompact && "text-[2rem]")}>
                Where the day disappears
              </CardTitle>
              <CardDescription className={cn("text-base leading-7 text-[#d2d7df]", isCompact && "text-sm leading-6")}>
                This work is not trivial. It shapes cycle time, service quality, and team morale.
              </CardDescription>
            </CardHeader>
            <CardContent className={cn("space-y-3", isCompact && "space-y-2 pt-0")}>
              {repetitiveWorkstreams.map((item) => (
                <div
                  key={item.title}
                  className={cn(
                    "rounded-[1.45rem] border border-white/8 bg-black/18 px-4 py-3.5",
                    isCompact && "px-3.5 py-3"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="size-5 text-[#95f2df]" />
                    <div className="text-sm font-medium text-[#fff7ec]">{item.title}</div>
                  </div>
                  <div className="mt-2 text-sm leading-6 text-[#d5dae2]">{item.copy}</div>
                </div>
              ))}

              <div className="rounded-[1.45rem] border border-dashed border-white/12 bg-white/4 px-4 py-3 text-sm leading-6 text-[#d8dde4]">
                The cost shows up everywhere: slower decisions, weaker service, harder governance, and more pressure on the people doing the work.
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-3 sm:grid-cols-2">
            {organizationPressures.map((pressure) => (
              <div
                key={pressure.title}
                className="rounded-[1.6rem] border border-white/10 bg-white/7 p-4 shadow-[0_20px_70px_rgba(0,0,0,0.24)] backdrop-blur"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-2xl border border-white/10 bg-black/20">
                    <pressure.icon className="size-[18px] text-[#f5c483]" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-[#fff7ec]">{pressure.title}</div>
                    <div className="text-[12px] uppercase tracking-[0.18em] text-[#91a6bd]">What the org absorbs</div>
                  </div>
                </div>
                <div className="mt-3 text-sm leading-6 text-[#cfd6df]">{pressure.copy}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SlideScrollArea>
  )
}
