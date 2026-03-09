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

import { closeProofPoints, closeQuestions } from "../slide-data"
import { SectionHeading } from "../slide-shared"

export function CloseSlide({ onRestart }: { onRestart: () => void }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.08fr_0.92fr]">
      <div className="space-y-6">
        <SectionHeading
          eyebrow="What comes next"
          title="The question isn't whether agents can help. It's what kind of claims organization you want to build."
          description="The platform already proves the shape — explainable agents, private data, persona-aware views, governed flow. Now: choose how far to push it."
        />

        <div className="grid gap-3 sm:grid-cols-2">
          {closeQuestions.map((question) => (
            <div key={question} className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3.5 text-sm leading-relaxed text-[#edf1f5]">
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

      <Card className="border-white/10 bg-white/7 text-white shadow-lg backdrop-blur">
        <CardHeader>
          <CardTitle className="font-[family:var(--font-fraunces)] text-2xl text-[#fff7ec] lg:text-3xl">
            Already proven
          </CardTitle>
          <CardDescription className="text-sm leading-relaxed text-[#d1d7df] lg:text-base">
            This is a working product with a narrative layer built into it — not a concept deck.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {closeProofPoints.map((item) => (
            <div key={item.title} className="rounded-2xl border border-white/8 bg-black/18 px-4 py-3.5">
              <div className="flex items-start gap-3">
                <item.icon className="mt-0.5 size-5 text-[#95f2df]" />
                <div>
                  <div className="text-sm font-medium text-[#fff7ec]">{item.title}</div>
                  <div className="mt-1 text-sm leading-relaxed text-[#d1d7df]">{item.copy}</div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
