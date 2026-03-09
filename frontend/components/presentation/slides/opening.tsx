"use client"

import Link from "next/link"
import { motion } from "motion/react"
import { ArrowRight, Eye, PanelTop, UsersRound, Workflow } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

import type { SlideProps } from "../slide-shared"
import { DeckPill } from "../slide-shared"

export function OpeningSlide({
  isCompact,
  isShort,
  onNext,
  shouldAnimate,
}: SlideProps & { onNext: () => void; shouldAnimate: boolean }) {
  const narrative = isShort
    ? "Status chasing, document loops, and context stitching consume the day before a real decision can happen. This is about getting that time back — with governance, not despite it."
    : "Every claim requires judgment. But before judgment happens, teams burn hours assembling evidence, chasing status, stitching context across tools, and rebuilding what colleagues already knew. This deck is about what changes when that work compresses."

  return (
    <div className="grid h-full gap-8 lg:grid-cols-[minmax(0,0.98fr)_minmax(320px,0.82fr)] xl:items-start xl:gap-14">
      <div className="space-y-5 xl:pt-1">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] uppercase tracking-[0.34em] text-[#f5c483] backdrop-blur">
            <span>Story deck</span>
            <span className="h-1 w-1 rounded-full bg-white/20" />
            <span>Operating model narrative</span>
          </div>
          <h1
            className={cn(
              "max-w-[14ch] font-[family:var(--font-fraunces)] text-[clamp(3rem,5.2vw,5.1rem)] leading-[0.9] tracking-[-0.052em] text-[#fff7ec]",
              isCompact && "max-w-[14ch] text-[clamp(2.55rem,4.7vw,4.65rem)]"
            )}
          >
            Claims teams spend their best judgment on repetitive work.
          </h1>
          <p
            className={cn(
              "max-w-[43rem] text-[15px] leading-7 text-[#d1d7df] sm:text-[1.02rem]",
              isCompact && "max-w-[40rem] text-sm leading-6 sm:text-sm"
            )}
          >
            {narrative}
          </p>
        </div>

        {isCompact ? (
          <div className="flex flex-wrap gap-2">
            {[
              "Industry lens first",
              "Human-led, agent-guided",
              "Governed AI operations",
            ].map((item) => (
              <div
                key={item}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] text-[#d9dde3] backdrop-blur"
              >
                {item}
              </div>
            ))}
          </div>
        ) : (
          <div className="grid max-w-[48rem] gap-2 sm:grid-cols-3">
            <DeckPill label="Industry lens" value="Insurance workday first" />
            <DeckPill label="Operating model" value="Human-led, agent-guided" />
            <DeckPill label="Control model" value="Traceable by design" />
          </div>
        )}

        {!isShort && (
          <div className="flex flex-wrap items-center gap-3">
            <Button
              className="rounded-full bg-[#fff2e1] px-6 text-[#172333] hover:bg-[#ffe3c1]"
              onClick={onNext}
            >
              Start with the workday
              <ArrowRight className="size-4" />
            </Button>
            <Button
              variant="outline"
              asChild
              className="rounded-full border-white/15 bg-white/5 px-6 text-[#fff7ec] hover:bg-white/10 hover:text-[#fff7ec]"
            >
              <Link href="/">Jump into the live workbench</Link>
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-3 xl:pt-2 2xl:pl-4 2xl:pt-4">
        <Card className="border-white/10 bg-white/8 text-white shadow-[0_35px_120px_rgba(0,0,0,0.34)] backdrop-blur">
          <CardHeader className={cn(isCompact && "space-y-2 pb-3")}>
            <CardTitle className="flex items-center gap-3 text-[#fff7ec]">
              <PanelTop className="size-5 text-[#9ef2de]" />
              What this deck does
            </CardTitle>
            <CardDescription className={cn("text-[#d1d7df]", isCompact && "text-sm leading-5")}>
              A presenter-led web narrative, not a screenshot gallery.
            </CardDescription>
          </CardHeader>
          <CardContent className={cn("grid gap-3 text-sm text-[#eef2f6]", isCompact && "gap-2 pt-0")}>
            {[
              "Starts with the insurer operating reality before showing the product.",
              "Maps repetitive work across the people who carry claims every day.",
              "Reveals the governed human-agent system built to change that work.",
            ].map((text) => (
              <div
                key={text}
                className={cn(
                  "rounded-2xl border border-white/8 bg-black/15 px-4 py-3.5",
                  isCompact && "px-3.5 py-2.5 text-[13px] leading-5"
                )}
              >
                {text}
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { label: "4", title: "Core personas", icon: UsersRound },
            { label: "3", title: "Repetitive loops", icon: Workflow },
            { label: "1", title: "Governed workflow", icon: Eye },
          ].map((item) => (
            <motion.div
              key={item.title}
              className="rounded-[1.7rem] border border-white/10 bg-white/8 px-5 py-4 shadow-[0_20px_55px_rgba(0,0,0,0.22)] backdrop-blur"
              initial={shouldAnimate ? { opacity: 0, y: 12 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
            >
              <item.icon className="size-5 text-[#f8c977]" />
              <div className="mt-3 font-[family:var(--font-fraunces)] text-[2.6rem] text-[#fff7ec]">
                {item.label}
              </div>
              <div className="mt-1 text-sm text-[#d1d7df]">{item.title}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
