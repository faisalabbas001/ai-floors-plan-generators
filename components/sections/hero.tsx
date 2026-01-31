'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Play } from 'lucide-react'
import Image from 'next/image'
import { useState, useRef, useEffect } from 'react'

export function Hero() {
  const [rotateX, setRotateX] = useState(0)
  const [rotateY, setRotateY] = useState(0)
  const [isHovering, setIsHovering] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Typing animation state
  const fullText = 'Floor Plan Design '
  const [displayedText, setDisplayedText] = useState('')
  const [showCursor, setShowCursor] = useState(true)
  const [isTypingComplete, setIsTypingComplete] = useState(false)

  // Auto-animate when not hovering
  useEffect(() => {
    if (isHovering) return

    let animationFrame: number
    let startTime: number

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const elapsed = timestamp - startTime

      // Smooth floating animation
      const x = Math.sin(elapsed * 0.001) * 5
      const y = Math.cos(elapsed * 0.0008) * 3

      setRotateX(x)
      setRotateY(y)

      animationFrame = requestAnimationFrame(animate)
    }

    animationFrame = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(animationFrame)
  }, [isHovering])

  // Typing effect
  useEffect(() => {
    if (displayedText.length < fullText.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(fullText.slice(0, displayedText.length + 1))
      }, 80) // Speed of typing
      return () => clearTimeout(timeout)
    } else {
      setIsTypingComplete(true)
    }
  }, [displayedText, fullText])

  // Blinking cursor effect
  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor((prev) => !prev)
    }, 530)
    return () => clearInterval(cursorInterval)
  }, [])

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    const mouseX = e.clientX - centerX
    const mouseY = e.clientY - centerY

    // Limit rotation to ±10 degrees for subtle effect
    const maxRotation = 10
    const rotationY = (mouseX / (rect.width / 2)) * maxRotation
    const rotationX = -(mouseY / (rect.height / 2)) * maxRotation

    setRotateX(rotationX)
    setRotateY(rotationY)
  }

  const handleMouseEnter = () => {
    setIsHovering(true)
  }

  const handleMouseLeave = () => {
    setIsHovering(false)
  }

  return (
    <section className="container mx-auto px-4 py-16 md:py-24 overflow-hidden">
      <div className="grid items-center gap-8 md:gap-12 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-5xl lg:text-6xl">
              {displayedText}
              <span
                className={`inline-block w-[3px] h-[1em] bg-primary ml-1 align-middle transition-opacity ${
                  showCursor && !isTypingComplete ? 'opacity-100' : 'opacity-0'
                }`}
              />
              {isTypingComplete && (
                <span className="text-primary animate-fade-in">Made Simple</span>
              )}
            </h1>
            <p className="text-lg text-muted-foreground md:text-xl">
              Design and draw floor plans online in minutes — free, accurate, and easy to use. Plan layouts, rooms, and renovations effortlessly with Floor Plan AI.
            </p>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row">
            <Button size="lg" className="gap-2" asChild>
              <Link href="/generator">
                Start Your Floor Plan <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="gap-2 bg-transparent" asChild>
              <Link href="/live-design">
                <Play className="h-4 w-4" />
                Try Drawing Online
              </Link>
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-muted-foreground">10,000+ Happy Users</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <span className="text-muted-foreground">50,000+ Floor Plans Created</span>
            </div>
          </div>
        </div>

        {/* 3D Interactive Image */}
        <div
          ref={containerRef}
          className="relative flex items-center justify-center"
          onMouseMove={handleMouseMove}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{ perspective: '1000px' }}
        >
          <div
            className="relative transition-transform duration-300 ease-out"
            style={{
              transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
              transformStyle: 'preserve-3d',
            }}
          >
            <div className="relative w-[280px] h-[240px] sm:w-[350px] sm:h-[300px] md:w-[480px] md:h-[400px] lg:w-[580px] lg:h-[500px]">
              <Image
                src="/images/50929-removebg-preview-Picsart-AiImageEnhancer.png"
                alt="3D Floor Plan Visualization"
                fill
                className="object-contain drop-shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]"
                sizes="(max-width: 640px) 280px, (max-width: 768px) 350px, (max-width: 1024px) 480px, 580px"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
