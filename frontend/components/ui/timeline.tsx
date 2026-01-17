"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface TimelineProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

interface TimelineItemProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  icon?: React.ReactNode
  iconClassName?: string
  lineClassName?: string
}

interface TimelineContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

interface TimelineHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

interface TimelineTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode
}

interface TimelineDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode
}

const Timeline = React.forwardRef<HTMLDivElement, TimelineProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("relative space-y-0", className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Timeline.displayName = "Timeline"

const TimelineItem = React.forwardRef<HTMLDivElement, TimelineItemProps>(
  ({ className, children, icon, iconClassName, lineClassName, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("relative flex gap-4 pb-8 last:pb-0", className)}
        {...props}
      >
        {/* Timeline line and icon */}
        <div className="flex flex-col items-center">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full border-2 bg-background text-sm font-medium z-10",
              iconClassName
            )}
          >
            {icon}
          </div>
          <div
            className={cn(
              "w-0.5 flex-1 bg-border",
              lineClassName
            )}
          />
        </div>
        {/* Content */}
        <div className="flex-1 pt-1.5 pb-4">{children}</div>
      </div>
    )
  }
)
TimelineItem.displayName = "TimelineItem"

const TimelineContent = React.forwardRef<HTMLDivElement, TimelineContentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("space-y-2", className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
TimelineContent.displayName = "TimelineContent"

const TimelineHeader = React.forwardRef<HTMLDivElement, TimelineHeaderProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("flex items-center gap-2", className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
TimelineHeader.displayName = "TimelineHeader"

const TimelineTitle = React.forwardRef<HTMLHeadingElement, TimelineTitleProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <h3
        ref={ref}
        className={cn("font-semibold leading-none tracking-tight", className)}
        {...props}
      >
        {children}
      </h3>
    )
  }
)
TimelineTitle.displayName = "TimelineTitle"

const TimelineDescription = React.forwardRef<HTMLParagraphElement, TimelineDescriptionProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn("text-sm text-muted-foreground", className)}
        {...props}
      >
        {children}
      </p>
    )
  }
)
TimelineDescription.displayName = "TimelineDescription"

export {
  Timeline,
  TimelineItem,
  TimelineContent,
  TimelineHeader,
  TimelineTitle,
  TimelineDescription,
}
