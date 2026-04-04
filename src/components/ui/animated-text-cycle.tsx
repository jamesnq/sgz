'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

interface AnimatedWordCycleProps {
  words: string[] | string[][]
  interval?: number
  className?: string
}

// Animation variants - defined outside component to prevent recreation on each render
const containerVariants = {
  hidden: {
    y: -20,
    opacity: 0,
    filter: 'blur(8px)',
  },
  visible: {
    y: 0,
    opacity: 1,
    filter: 'blur(0px)',
    transition: {
      duration: 0.4,
      ease: 'easeOut',
    },
  },
  exit: {
    y: 20,
    opacity: 0,
    filter: 'blur(8px)',
    transition: {
      duration: 0.3,
      ease: 'easeIn',
    },
  },
}

export default function AnimatedWordCycle({
  words,
  interval = 5000,
  className = '',
}: AnimatedWordCycleProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [widths, setWidths] = useState<string[]>(['auto'])
  const [exiting, setExiting] = useState<Record<number, boolean>>({})
  const measureRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<HTMLDivElement>(null)
  const intervalRef = useRef<NodeJS.Timeout>(null)

  // Determine if we have multiple word arrays or a single array
  const isMultiArray = useMemo(() => Array.isArray(words[0]), [words])

  // Memoize wordArrays to prevent re-creation on each render
  const wordArrays = useMemo(
    () => (isMultiArray ? (words as string[][]) : [words as string[]]),
    [words, isMultiArray],
  )

  // Calculate max length once
  const maxLength = useMemo(() => Math.max(...wordArrays.map((arr) => arr.length)), [wordArrays])

  // Memoize the current words to prevent unnecessary re-renders and animations
  const currentWords = useMemo(
    () => wordArrays.map((arr) => arr[currentIndex % arr.length] || ''),
    [wordArrays, currentIndex],
  )

  // Update exiting state when words change
  useEffect(() => {
    const newExiting = { ...exiting }
    let changed = false

    // Mark indices that no longer have words as exiting
    wordArrays.forEach((_, arrayIndex) => {
      const hasWord = Boolean(currentWords[arrayIndex])
      if (!hasWord && !newExiting[arrayIndex]) {
        newExiting[arrayIndex] = true
        changed = true
      }
    })

    if (changed) {
      setExiting(newExiting)
    }
  }, [currentWords, wordArrays, exiting])

  // Get the width of the current words - more accurate measurement
  useEffect(() => {
    if (!measureRef.current) return

    const elements = measureRef.current.children
    const newWidths: string[] = []

    wordArrays.forEach((_, arrayIndex) => {
      const elementIndex = arrayIndex * maxLength + currentIndex
      if (elements.length > elementIndex) {
        // @ts-expect-error ignore
        const width = elements[elementIndex].getBoundingClientRect().width
        // Add a small buffer (2px) to prevent text wrapping or cutting off
        newWidths.push(`${Math.ceil(width)}px`)
      } else {
        newWidths.push('auto')
      }
    })

    setWidths(newWidths)
  }, [currentIndex, maxLength, wordArrays])

  // Set up interval timer with cleanup
  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    // Set up new interval
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % maxLength)
    }, interval)

    // Clean up on unmount or interval change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [interval, maxLength])

  // Handle animation exit completion
  const handleExitComplete = (arrayIndex: number) => {
    setExiting((prev) => {
      const newExiting = { ...prev }
      delete newExiting[arrayIndex]
      return newExiting
    })
  }

  // Render measurement div for all words
  const renderMeasurementDiv = () => (
    <div
      ref={measureRef}
      aria-hidden="true"
      className="absolute opacity-0 pointer-events-none"
      style={{ visibility: 'hidden' }}
    >
      {wordArrays.map((wordArray, arrayIndex) =>
        wordArray.map((word, wordIndex) => (
          <span
            key={`${arrayIndex}-${wordIndex}`}
            className={`inline-block font-bold ${className}`}
          >
            {word}
          </span>
        )),
      )}
    </div>
  )

  return (
    <div ref={animationRef} className="inline-flex">
      {/* Hidden measurement div with all words rendered */}
      {renderMeasurementDiv()}

      {/* Render multiple animated words */}
      {wordArrays.map((_, arrayIndex) => {
        const currentWord = currentWords[arrayIndex]
        const isExiting = exiting[arrayIndex]

        // If no word and not in exit animation, don't render anything
        if (!currentWord && !isExiting) return null

        return (
          <span key={`fragment-${arrayIndex}`} className="inline-flex items-center">
            <motion.span
              className="inline-block"
              animate={{
                width: widths[arrayIndex] || 'auto',
                transition: {
                  type: 'spring',
                  stiffness: 150,
                  damping: 15,
                  mass: 1.2,
                },
              }}
              style={{ overflow: 'hidden' }}
            >
              <AnimatePresence
                mode="wait"
                initial={false}
                onExitComplete={() => handleExitComplete(arrayIndex)}
              >
                {currentWord ? (
                  <motion.span
                    key={`${arrayIndex}-${currentWord}`}
                    className={`inline-block font-bold ${className}`}
                    variants={containerVariants as any}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    {currentWord}
                  </motion.span>
                ) : isExiting ? (
                  <motion.span
                    key={`${arrayIndex}-exiting`}
                    className={`inline-block font-bold ${className}`}
                    variants={containerVariants as any}
                    initial="visible"
                    exit="exit"
                    style={{ whiteSpace: 'nowrap', opacity: 0 }}
                  />
                ) : null}
              </AnimatePresence>
            </motion.span>
            {arrayIndex < wordArrays.length - 1 && currentWord && (
              <span className="inline-block">&nbsp;</span>
            )}
          </span>
        )
      })}
    </div>
  )
}
