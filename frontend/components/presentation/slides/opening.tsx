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

import { DeckPill } from "../slide-shared"

export function OpeningSlide({
  onNext,
  shouldAnimate,
}: {
  onNext: () => void
  shouldAnimate: boolean
}) {
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.82fr)] xl:gap-14">
      <div className="space-y-5">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] uppercase tracking-[0.34em] text-[#f5c483] backdrop-blur">
            <span>Story deck</span>
            <span className="h-1 w-1 rounded-full bg-white/20" />
            <span>Operating model narrative</span>
          </div>
          <h1 className="max-w-[14ch] font-[family:var(--font-fraunces)] text-4xl leading-[0.9] tracking-tight text-[#fff7ec] sm:text-5xl lg:text-6xl xl:text-[5.1rem]">
            Claims teams spend their best judgment on repetitive work.
          </h1>
          <p className="max-w-[43rem] text-sm leading-relaxed text-[#d1d7df] sm:text-base lg:text-[1.02rem] lg:leading-7">
            Every claim requires judgment. But before judgment happens, teams burn hours assembling
            evidence, chasing status, stitching context across tools, and rebuilding what colleagues
            already knew. This deck is about what changes when that work compresses.
          </p>
        </div>

        <div className="grid max-w-[48rem] gap-2 sm:grid-cols-3">
          <DeckPill label="Industry lens" value="Insurance workday first" />
          <DeckPill label="Operating model" value="Human-led, agent-guided" />
          <DeckPill label="Control model" value="Traceable by design" />
        </div>

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
      </div>

      <div className="grid gap-3">
        <Card className="border-white/10 bg-white/8 text-white shadow-lg backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-[#fff7ec]">
              <PanelTop className="size-5 text-[#9ef2de]" />
              What this deck does
            </CardTitle>
            <CardDescription className="text-[#d1d7df]">
              A presenter-led web narrative, not a screenshot gallery.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm text-[#eef2f6]">
            {[
              "Starts with the insurer operating reality before showing the product.",
              "Maps repetitive work across the people who carry claims every day.",
              "Reveals the governed human-agent system built to change that work.",
            ].map((text) => (
              <div
                key={text}
                className="rounded-2xl border border-white/8 bg-black/15 px-4 py-3"
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
              className="rounded-2xl border border-white/10 bg-white/8 px-5 py-4 shadow-lg backdrop-blur"
              initial={shouldAnimate ? { opacity: 0, y: 12 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
            >
              <item.icon className="size-5 text-[#f8c977]" />
              <div className="mt-3 font-[family:var(--font-fraunces)] text-4xl text-[#fff7ec]">
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
