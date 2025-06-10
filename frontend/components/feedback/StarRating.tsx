'use client'

import React, { useState } from 'react'
import { IconStar, IconStarFilled } from '@tabler/icons-react'
import { cn } from '@/lib/utils'

interface StarRatingProps {
  value: number
  onChange: (rating: number) => void
  max?: number
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  showValue?: boolean
  label?: string
  required?: boolean
  className?: string
}

export function StarRating({
  value,
  onChange,
  max = 5,
  size = 'md',
  disabled = false,
  showValue = false,
  label,
  required = false,
  className = ""
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null)

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  }

  const handleStarClick = (rating: number) => {
    if (!disabled) {
      onChange(rating)
    }
  }

  const handleStarHover = (rating: number) => {
    if (!disabled) {
      setHoverValue(rating)
    }
  }

  const handleMouseLeave = () => {
    setHoverValue(null)
  }

  const getStarColor = (starIndex: number) => {
    const currentValue = hoverValue !== null ? hoverValue : value
    
    if (starIndex <= currentValue) {
      return 'text-yellow-400 fill-yellow-400'
    }
    return 'text-gray-300'
  }

  const getRatingText = (rating: number) => {
    switch (rating) {
      case 1: return 'Poor'
      case 2: return 'Fair'
      case 3: return 'Good'
      case 4: return 'Very Good'
      case 5: return 'Excellent'
      default: return ''
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="flex items-center space-x-1">
        <div 
          className="flex items-center space-x-1"
          onMouseLeave={handleMouseLeave}
        >
          {Array.from({ length: max }, (_, index) => {
            const starValue = index + 1
            const isActive = starValue <= (hoverValue !== null ? hoverValue : value)
            
            return (
              <button
                key={starValue}
                type="button"
                onClick={() => handleStarClick(starValue)}
                onMouseEnter={() => handleStarHover(starValue)}
                disabled={disabled}
                className={cn(
                  "transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 rounded",
                  disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:scale-110 transform transition-transform"
                )}
                aria-label={`Rate ${starValue} out of ${max} stars`}
              >
                {isActive ? (
                  <IconStarFilled className={cn(sizeClasses[size], getStarColor(starValue))} />
                ) : (
                  <IconStar className={cn(sizeClasses[size], getStarColor(starValue))} />
                )}
              </button>
            )
          })}
        </div>
        
        {showValue && value > 0 && (
          <div className="flex items-center space-x-2 ml-3">
            <span className="text-sm font-medium">{value}/{max}</span>
            {max === 5 && (
              <span className="text-sm text-muted-foreground">
                ({getRatingText(value)})
              </span>
            )}
          </div>
        )}
      </div>
      
      {hoverValue !== null && max === 5 && (
        <div className="text-xs text-muted-foreground">
          {getRatingText(hoverValue)}
        </div>
      )}
    </div>
  )
} 