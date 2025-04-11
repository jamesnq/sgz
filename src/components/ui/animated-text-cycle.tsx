'use client'

import React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'

interface AnimatedWordCycleProps {
  words: string[] | string[][]
  interval?: number
  className?: string
}

export default function AnimatedWordCycle({
  words,
  interval = 5000,
  className = '',
}: AnimatedWordCycleProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [widths, setWidths] = useState<string[]>(['auto'])
  const measureRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<HTMLDivElement>(null)

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

  // Get the width of the current words - more accurate measurement
  useEffect(() => {
    if (measureRef.current) {
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
    }
  }, [currentIndex, maxLength, wordArrays])

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % maxLength)
    }, interval)

    return () => clearInterval(timer)
  }, [interval, maxLength])

  // Container animation for the whole word
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

  // If it's a single array, render the original component
  if (!isMultiArray) {
    return (
      <>
        {/* Hidden measurement div with all words rendered */}
        <div
          ref={measureRef}
          aria-hidden="true"
          className="absolute opacity-0 pointer-events-none"
          style={{ visibility: 'hidden' }}
        >
          {(words as string[]).map((word, i) => (
            <span key={i} className={`inline-block font-bold ${className}`}>
              {word}
            </span>
          ))}
        </div>

        {/* Visible animated word */}
        <motion.span
          className="relative inline-block"
          animate={{
            width: widths[0],
            transition: {
              type: 'spring',
              stiffness: 150,
              damping: 15,
              mass: 1.2,
            },
          }}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={currentWords[0]}
              className={`inline-block font-bold ${className}`}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              style={{ whiteSpace: 'nowrap' }}
            >
              {currentWords[0]}
            </motion.span>
          </AnimatePresence>
        </motion.span>
      </>
    )
  }

  return (
    <div ref={animationRef} className="inline-flex">
      {/* Hidden measurement div with all words rendered */}
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

      {/* Render multiple animated words */}
      {wordArrays.map((_, arrayIndex) => {
        const currentWord = currentWords[arrayIndex]
        return (
          <span key={`fragment-${arrayIndex}`} className={`inline-flex items-center }`}>
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
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={`${arrayIndex}-${currentWord}`}
                  className={`inline-block font-bold ${className}`}
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  style={{ whiteSpace: 'nowrap' }}
                >
                  {currentWord}
                </motion.span>
              </AnimatePresence>
            </motion.span>
            {arrayIndex < wordArrays.length - 1 && <span className="inline-block">&nbsp;</span>}
          </span>
        )
      })}
    </div>
  )
}
