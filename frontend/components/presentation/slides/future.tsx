"use client"

import { motion } from "motion/react"
import { Rocket } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { roadmap } from "../slide-data"
import { SectionHeading } from "../slide-shared"

export function FutureSlide() {
  return (
    <div className="flex flex-col gap-6">
      <SectionHeading
        eyebrow="Future horizon"
        title="The long game isn't a bigger assistant. It's a smarter claims operating system."
        description="Today proves the shape. Next: agents negotiate, adapt, and rebalance as part of a broader claims mesh."
      />

      <div className="grid gap-3 lg:grid-cols-3">
        {roadmap.map((step, index) => (
          <motion.div
            key={step.phase}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 + index * 0.08 }}
          >
            <Card className="flex h-full flex-col border-white/10 bg-white/6 text-white shadow-lg backdrop-blur">
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <Badge className="border-0 bg-[#fff1de] text-[#152133]">{step.phase}</Badge>
                  <Rocket className="size-5 text-[#95f2df]" />
                </div>
                <CardTitle className="font-[family:var(--font-fraunces)] text-2xl text-[#fff7ec] lg:text-3xl">
                  {step.title}
                </CardTitle>
                <CardDescription className="text-sm leading-relaxed text-[#d1d7df] lg:text-base">
                  {step.focus}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-3">
                {step.bullets.map((bullet) => (
                  <div key={bullet} className="flex flex-1 items-center rounded-2xl border border-white/8 bg-black/18 px-4 py-3 text-sm leading-relaxed text-[#edf1f5]">
                    {bullet}
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
