"use client"

import { useState } from "react"
import { motion } from "motion/react"

import { cn } from "@/lib/utils"

import { insurancePersonas } from "../slide-data"
import type { SlideProps } from "../slide-shared"
import { SectionHeading, SlideFitFrame } from "../slide-shared"

export function PersonasSlide({ isCompact, isShort }: SlideProps) {
  const [activeId, setActiveId] = useState(insurancePersonas[0].id)
  const activeCard =
    insurancePersonas.find((p) => p.id === activeId) ?? insurancePersonas[0]

  return (
    <SlideFitFrame>
      <div className="flex flex-col gap-6 pb-4">
        <SectionHeading
          eyebrow="Core personas"
          title="Same friction. Different pain."
          description="A useful claims platform has to fit the real operating roles inside an insurer — not flatten them into one generic user."
          compact={isCompact}
        />

        {isShort ? (
          <div className="grid gap-4 lg:grid-cols-[0.42fr_0.58fr]">
            <div className="rounded-[1.75rem] border border-white/10 bg-white/7 p-4 shadow-[0_22px_80px_rgba(0,0,0,0.26)] backdrop-blur">
              <div className="text-[10px] uppercase tracking-[0.28em] text-[#91a6bd]">
                Who the deck is speaking to
              </div>
              <div className="mt-3 space-y-2">
                {insurancePersonas.map((persona) => {
                  const isActive = persona.id === activeCard.id
                  return (
                    <button
                      key={persona.id}
                      type="button"
                      onClick={() => setActiveId(persona.id)}
                      className={cn(
                        "w-full cursor-pointer rounded-[1.15rem] border px-4 py-3 text-left transition-all",
                        isActive
                          ? "border-white/20 bg-white/12 text-[#fff7ec]"
                          : "border-white/8 bg-black/18 text-[#d1d7df] hover:border-white/14 hover:bg-white/8"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <persona.icon className={cn("size-4", isActive ? "text-[#95f2df]" : "text-[#f5c483]")} />
                        <div>
                          <div className="text-sm font-medium">{persona.name}</div>
                          <div className="text-[11px] text-[#95a7ba]">Insurance role</div>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            <motion.div
              key={activeCard.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.28 }}
              className="rounded-[1.8rem] border border-white/10 bg-[#09131f]/78 p-5 shadow-[0_26px_90px_rgba(0,0,0,0.28)] backdrop-blur"
            >
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-black/18">
                  <activeCard.icon className="size-5 text-[#95f2df]" />
                </div>
                <div>
                  <div className="text-lg font-medium text-[#fff7ec]">{activeCard.name}</div>
                  <div className="mt-1 text-sm leading-6 text-[#d6dce4]">{activeCard.role}</div>
                </div>
              </div>

              <div className="mt-4 rounded-[1.3rem] border border-white/8 bg-black/18 px-4 py-3 text-sm leading-6 text-[#d1d7df]">
                {activeCard.burden}
              </div>
              <div className="mt-3 rounded-[1.3rem] border border-white/8 bg-white/6 px-4 py-3 text-sm leading-6 text-[#eef2f5]">
                <div className="text-[10px] uppercase tracking-[0.28em] text-[#f5c483]">
                  What they need
                </div>
                <div className="mt-2">{activeCard.needs}</div>
              </div>
            </motion.div>
          </div>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {insurancePersonas.map((persona, index) => (
                <motion.div
                  key={persona.name}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.06 + index * 0.05 }}
                  className="rounded-[1.75rem] border border-white/10 bg-white/7 p-5 shadow-[0_22px_80px_rgba(0,0,0,0.26)] backdrop-blur"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-black/18">
                      <persona.icon className="size-5 text-[#95f2df]" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-[#fff7ec]">{persona.name}</div>
                      <div className="text-[10px] uppercase tracking-[0.24em] text-[#91a6bd]">
                        Insurance role
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 text-sm leading-6 text-[#eef2f5]">{persona.role}</div>
                  <div className="mt-3 rounded-[1.2rem] border border-white/8 bg-black/18 px-4 py-3 text-sm leading-6 text-[#d1d7df]">
                    {persona.burden}
                  </div>
                  <div className="mt-3">
                    <div className="text-[10px] uppercase tracking-[0.28em] text-[#f5c483]">
                      What they need
                    </div>
                    <div className="mt-2 rounded-[1.2rem] border border-white/8 bg-white/6 px-4 py-3 text-sm leading-6 text-[#eef2f5]">
                      {persona.needs}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="rounded-[1.6rem] border border-white/10 bg-black/18 px-5 py-4 text-sm leading-6 text-[#d9dee5]">
              Every role needs the same thing: less assembly, more judgment — without losing the audit trail.
            </div>
          </>
        )}
      </div>
    </SlideFitFrame>
  )
}
