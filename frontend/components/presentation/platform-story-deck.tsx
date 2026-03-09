"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  startTransition,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import { Fraunces, IBM_Plex_Sans } from "next/font/google"
import { AnimatePresence, motion, MotionConfig } from "motion/react"
import {
  ChevronLeft,
  ChevronRight,
  Expand,
  Minimize,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { slideMeta, type SlideId } from "./slide-data"
import { OpeningSlide } from "./slides/opening"
import { OperationsSlide } from "./slides/operations"
import { PersonasSlide } from "./slides/personas"
import { MissionSlide } from "./slides/mission"
import { ArchitectureSlide } from "./slides/architecture"
import { AgentsSlide } from "./slides/agents"
import { WorkbenchSlide } from "./slides/workbench"
import { GovernanceSlide } from "./slides/governance"
import { FutureSlide } from "./slides/future"
import { CloseSlide } from "./slides/close"

/* ------------------------------------------------------------------ */
/*  Fonts                                                              */
/* ------------------------------------------------------------------ */

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-fraunces",
})

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-sans",
})

/* ------------------------------------------------------------------ */
/*  Slide navigation helpers                                           */
/* ------------------------------------------------------------------ */

function clampSlideIndex(index: number) {
  return Math.max(0, Math.min(slideMeta.length - 1, index))
}

function resolveSlideIndex(slide: string | null) {
  if (!slide) return 0
  const normalized = slide.trim().toLowerCase()
  const numericIndex = Number(normalized)
  if (!Number.isNaN(numericIndex) && numericIndex >= 1) {
    return clampSlideIndex(numericIndex - 1)
  }
  const metaIndex = slideMeta.findIndex((entry) => entry.id === normalized)
  return metaIndex === -1 ? 0 : metaIndex
}

/* ------------------------------------------------------------------ */
/*  Slide transition variants                                          */
/* ------------------------------------------------------------------ */

const slideVariants = {
  enter: (direction: number) => ({
    opacity: 0,
    x: direction >= 0 ? 60 : -60,
    scale: 0.98,
    filter: "blur(12px)",
  }),
  center: {
    opacity: 1,
    x: 0,
    scale: 1,
    filter: "blur(0px)",
  },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction >= 0 ? -60 : 60,
    scale: 1.01,
    filter: "blur(12px)",
  }),
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export function PlatformStoryDeck() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const requestedSlide = searchParams.get("slide")

  const [currentIndex, setCurrentIndex] = useState(() =>
    resolveSlideIndex(requestedSlide)
  )
  const [slideDirection, setSlideDirection] = useState(1)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)
  const [hasMounted, setHasMounted] = useState(false)

  const currentSlide = slideMeta[currentIndex]
  const isOpeningSlide = currentSlide.id === "opening"
  const shouldAnimate = hasMounted && hasInteracted

  /* ---- URL sync ---- */

  const syncSlideInUrl = useCallback((nextIndex: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("slide", slideMeta[nextIndex].id)
    const query = params.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
  }, [pathname, router, searchParams])

  const goToSlide = useCallback((nextIndex: number) => {
    const clamped = clampSlideIndex(nextIndex)
    if (clamped === currentIndex) return
    setHasInteracted(true)
    setSlideDirection(clamped > currentIndex ? 1 : -1)
    startTransition(() => {
      setCurrentIndex(clamped)
      syncSlideInUrl(clamped)
    })
  }, [currentIndex, syncSlideInUrl])

  const shiftSlide = useCallback((direction: number) => {
    const clamped = clampSlideIndex(currentIndex + direction)
    if (clamped === currentIndex) return
    setHasInteracted(true)
    setSlideDirection(direction >= 0 ? 1 : -1)
    startTransition(() => {
      setCurrentIndex(clamped)
      syncSlideInUrl(clamped)
    })
  }, [currentIndex, syncSlideInUrl])

  const toggleFullscreen = useCallback(async () => {
    setHasInteracted(true)
    if (typeof document === "undefined") return
    if (document.fullscreenElement) {
      await document.exitFullscreen()
      return
    }
    await document.documentElement.requestFullscreen()
  }, [])

  /* ---- Side effects ---- */

  useEffect(() => { setHasMounted(true) }, [])

  useEffect(() => {
    const nextIndex = resolveSlideIndex(requestedSlide)
    if (nextIndex === currentIndex) return
    setSlideDirection(nextIndex > currentIndex ? 1 : -1)
    setCurrentIndex(nextIndex)
  }, [currentIndex, requestedSlide])

  useEffect(() => {
    if (typeof document === "undefined") return
    const { body, documentElement } = document
    const prev = {
      bodyOverflow: body.style.overflow,
      htmlOverflow: documentElement.style.overflow,
    }
    body.style.overflow = "hidden"
    documentElement.style.overflow = "hidden"
    window.scrollTo(0, 0)
    return () => {
      body.style.overflow = prev.bodyOverflow
      documentElement.style.overflow = prev.htmlOverflow
    }
  }, [])

  useEffect(() => {
    if (currentIndex > 0) setHasInteracted(true)
  }, [currentIndex])

  useEffect(() => {
    const handler = () => setIsFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener("fullscreenchange", handler)
    return () => document.removeEventListener("fullscreenchange", handler)
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight" || event.key === "PageDown" || event.key === " ") {
        event.preventDefault()
        shiftSlide(1)
      }
      if (event.key === "ArrowLeft" || event.key === "PageUp") {
        event.preventDefault()
        shiftSlide(-1)
      }
      if (event.key === "Home") { event.preventDefault(); goToSlide(0) }
      if (event.key === "End") { event.preventDefault(); goToSlide(slideMeta.length - 1) }
      if (event.key.toLowerCase() === "f") { event.preventDefault(); void toggleFullscreen() }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [goToSlide, shiftSlide, toggleFullscreen])

  /* ---- Slide content map ---- */

  const slides: Record<SlideId, ReactNode> = {
    opening: (
      <OpeningSlide
        onNext={() => shiftSlide(1)}
        shouldAnimate={shouldAnimate}
      />
    ),
    operations: <OperationsSlide />,
    personas: <PersonasSlide />,
    mission: <MissionSlide />,
    architecture: <ArchitectureSlide />,
    agents: <AgentsSlide />,
    workbench: <WorkbenchSlide />,
    governance: <GovernanceSlide />,
    future: <FutureSlide />,
    close: <CloseSlide onRestart={() => goToSlide(0)} />,
  }

  const progress = ((currentIndex + 1) / slideMeta.length) * 100

  /* ---- Render ---- */

  return (
    <div
      className={cn(
        fraunces.variable,
        plexSans.variable,
        "h-dvh overflow-hidden bg-[#06111a] text-[#f8ead8]"
      )}
    >
      <MotionConfig reducedMotion="user">
      <div className="relative isolate flex h-full flex-col font-[family:var(--font-plex-sans)]">
        {/* Animated background */}
        <motion.div
          className="pointer-events-none absolute inset-0"
          animate={{
            background: [
              "radial-gradient(circle at 15% 20%, rgba(255, 187, 111, 0.18), transparent 25%), radial-gradient(circle at 82% 24%, rgba(94, 209, 184, 0.15), transparent 30%), linear-gradient(135deg, #06111a 0%, #0a1a29 45%, #120f1f 100%)",
              "radial-gradient(circle at 25% 18%, rgba(255, 187, 111, 0.15), transparent 28%), radial-gradient(circle at 74% 28%, rgba(94, 209, 184, 0.19), transparent 30%), linear-gradient(135deg, #06111a 0%, #0a1a29 42%, #171226 100%)",
              "radial-gradient(circle at 20% 32%, rgba(255, 187, 111, 0.14), transparent 28%), radial-gradient(circle at 78% 18%, rgba(94, 209, 184, 0.16), transparent 34%), linear-gradient(135deg, #07111b 0%, #0c1b2c 45%, #130f22 100%)",
            ],
          }}
          transition={{ duration: 18, repeat: Number.POSITIVE_INFINITY, repeatType: "mirror" }}
        />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:86px_86px] opacity-25" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0,rgba(4,8,14,0.24)_55%,rgba(4,8,14,0.82)_100%)]" />

        {/* Header */}
        <header className="relative z-30 shrink-0">
          <div className="mx-auto flex max-w-[98rem] items-center justify-between gap-4 px-4 py-4 sm:px-8 lg:px-12 xl:px-6">
            <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-2.5 shadow-lg backdrop-blur">
              <div className="flex items-center gap-3 text-[9px] uppercase tracking-[0.32em] text-[#9fb0c4]">
                <span>Contoso AI Claims</span>
                <span className="h-1 w-1 rounded-full bg-white/20" />
                <span>{isOpeningSlide ? "Story deck" : "Presentation route"}</span>
              </div>
              <div className="mt-1.5 text-sm font-medium text-[#fff7ec]">
                {currentSlide.section}
              </div>
            </div>

            <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-black/24 px-1.5 py-1.5 backdrop-blur">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => shiftSlide(-1)}
                disabled={currentIndex === 0}
                className="rounded-full text-[#fff7ec] hover:bg-white/10 hover:text-[#fff7ec] disabled:opacity-40"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <div className="px-3 text-sm text-[#d1d7df]">
                {String(currentIndex + 1).padStart(2, "0")} / {String(slideMeta.length).padStart(2, "0")}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => shiftSlide(1)}
                disabled={currentIndex === slideMeta.length - 1}
                className="rounded-full text-[#fff7ec] hover:bg-white/10 hover:text-[#fff7ec] disabled:opacity-40"
              >
                <ChevronRight className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => void toggleFullscreen()}
                className="rounded-full text-[#fff7ec] hover:bg-white/10 hover:text-[#fff7ec]"
                title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              >
                {isFullscreen ? <Minimize className="size-4" /> : <Expand className="size-4" />}
              </Button>
            </div>
          </div>

          <div className="h-px w-full bg-white/6">
            <motion.div
              className="h-px bg-gradient-to-r from-[#f5c483] via-[#95f2df] to-[#8ecbff]"
              animate={{ width: `${progress}%` }}
              transition={{ type: "spring", stiffness: 120, damping: 22 }}
            />
          </div>
        </header>

        {/* Body: sidebar + main */}
        <div className="relative z-10 flex min-h-0 flex-1">
          {/* Sidebar navigation rail */}
          {!isOpeningSlide && (
            <aside className="hidden w-64 shrink-0 p-4 xl:block">
              <div className="h-full overflow-y-auto rounded-2xl border border-white/10 bg-black/18 p-3 backdrop-blur">
                <div className="mb-3 px-3 text-[10px] uppercase tracking-[0.3em] text-[#9fb0c4]">
                  Slide map
                </div>
                <div className="space-y-1.5">
                  {slideMeta.map((slide, index) => {
                    const isActive = index === currentIndex
                    return (
                      <button
                        key={slide.id}
                        type="button"
                        onClick={() => goToSlide(index)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors",
                          isActive
                            ? "bg-white/12 text-[#fff7ec]"
                            : "text-[#c5ccd6] hover:bg-white/8 hover:text-[#fff7ec]"
                        )}
                      >
                        <div
                          className={cn(
                            "h-2.5 w-2.5 shrink-0 rounded-full",
                            isActive ? "bg-[#fff1de]" : "bg-white/25"
                          )}
                        />
                        <div>
                          <div className="text-xs font-medium">{slide.shortLabel}</div>
                          <div className="text-[11px] text-[#98aabd]">{slide.section}</div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </aside>
          )}

          {/* Main content */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 xl:pr-12">
            <div className="mx-auto flex min-h-full max-w-[90rem] flex-col justify-center">
              <AnimatePresence initial={false} mode="wait" custom={slideDirection}>
                <motion.section
                  key={currentSlide.id}
                  custom={slideDirection}
                  variants={slideVariants}
                  initial={shouldAnimate ? "enter" : false}
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.42, ease: "easeInOut" }}
                >
                  {slides[currentSlide.id]}
                </motion.section>
              </AnimatePresence>
            </div>
          </main>
        </div>

        {/* Footer hints */}
        <footer className="pointer-events-none relative z-20 shrink-0">
          <AnimatePresence initial={false}>
            {!hasInteracted && !isOpeningSlide && (
              <motion.div
                initial={shouldAnimate ? { opacity: 0, y: 18 } : false}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 18 }}
                transition={{ duration: 0.28, ease: "easeInOut" }}
                className="mx-auto mb-4 hidden w-fit items-center gap-3 rounded-full border border-white/10 bg-black/22 px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-[#9fb0c4] backdrop-blur md:flex"
              >
                <span>Use ← → or space to navigate</span>
                <span className="h-1 w-1 rounded-full bg-white/20" />
                <span>Press F for fullscreen</span>
              </motion.div>
            )}
          </AnimatePresence>
        </footer>
      </div>
      </MotionConfig>
    </div>
  )
}
