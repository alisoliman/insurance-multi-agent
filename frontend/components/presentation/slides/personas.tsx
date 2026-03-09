"use client"

import { motion } from "motion/react"

import { insurancePersonas } from "../slide-data"
import { SectionHeading } from "../slide-shared"

export function PersonasSlide() {
  return (
    <div className="flex flex-col gap-6">
      <SectionHeading
        eyebrow="Core personas"
        title="Same friction. Different pain."
        description="A useful claims platform has to fit the real operating roles inside an insurer — not flatten them into one generic user."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {insurancePersonas.map((persona, index) => (
          <motion.div
            key={persona.name}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 + index * 0.05 }}
            className="flex flex-col rounded-2xl border border-white/10 bg-white/7 p-5 shadow-lg backdrop-blur"
          >
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-black/18">
                <persona.icon className="size-5 text-[#95f2df]" />
              </div>
              <div>
                <div className="text-[15px] font-medium text-[#fff7ec]">{persona.name}</div>
                <div className="text-[10px] uppercase tracking-[0.24em] text-[#91a6bd]">
                  Insurance role
                </div>
              </div>
            </div>

            <div className="mt-4 text-sm leading-relaxed text-[#eef2f5]">{persona.role}</div>
            <div className="mt-3 flex-1 rounded-xl border border-white/8 bg-black/18 px-4 py-3 text-sm leading-relaxed text-[#d1d7df]">
              {persona.burden}
            </div>
            <div className="mt-3">
              <div className="text-[10px] uppercase tracking-[0.28em] text-[#f5c483]">
                What they need
              </div>
              <div className="mt-2 rounded-xl border border-white/8 bg-white/6 px-4 py-3 text-sm leading-relaxed text-[#eef2f5]">
                {persona.needs}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="rounded-2xl border border-white/10 bg-black/18 px-5 py-4 text-sm leading-relaxed text-[#d9dee5]">
        Every role needs the same thing: less assembly, more judgment — without losing the audit trail.
      </div>
    </div>
  )
}
