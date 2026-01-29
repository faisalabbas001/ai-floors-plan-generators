'use client'

import React from "react"

import { useRef, useState, useCallback } from 'react'
import { ZoomIn, ZoomOut, Maximize } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Shape {
  id: number
  type: string
  x: number
  y: number
  width: number
  height: number
  rotation: number
}

export function EditorCanvas() {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [shapes, setShapes] = useState<Shape[]>([
    {
      id: 1,
      type: 'table',
      x: 400,
      y: 300,
      width: 500,
      height: 300,
      rotation: 0,
    },
  ])
  const [selectedShape, setSelectedShape] = useState<number | null>(1)
  const [zoom, setZoom] = useState(100)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [isResizing, setIsResizing] = useState(false)
  const [resizeHandle, setResizeHandle] = useState<string | null>(null)

  const handleMouseDown = useCallback((e: React.MouseEvent, shapeId: number) => {
    e.stopPropagation()
    setSelectedShape(shapeId)
    setIsDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY })
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || selectedShape === null) return

    const dx = (e.clientX - dragStart.x) / (zoom / 100)
    const dy = (e.clientY - dragStart.y) / (zoom / 100)

    setShapes(prev => prev.map(shape => 
      shape.id === selectedShape
        ? { ...shape, x: shape.x + dx, y: shape.y + dy }
        : shape
    ))
    setDragStart({ x: e.clientX, y: e.clientY })
  }, [isDragging, selectedShape, dragStart, zoom])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setIsResizing(false)
    setResizeHandle(null)
  }, [])

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 10, 200))
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 10, 50))
  const handleZoomReset = () => setZoom(100)

  return (
    <div className="relative flex-1 overflow-auto bg-muted/30" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
      {/* Zoom Controls */}
      <div className="absolute right-4 bottom-4 z-10 flex flex-col gap-2 bg-background border border-border rounded-lg shadow-lg p-2">
        <Button variant="ghost" size="sm" onClick={handleZoomIn} className="h-8 w-8 p-0">
          <ZoomIn className="w-4 h-4" />
        </Button>
        <div className="text-xs font-medium text-center px-2">{zoom}%</div>
        <Button variant="ghost" size="sm" onClick={handleZoomOut} className="h-8 w-8 p-0">
          <ZoomOut className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={handleZoomReset} className="h-8 w-8 p-0">
          <Maximize className="w-4 h-4" />
        </Button>
      </div>

      {/* Ruler - Top */}
      <div className="absolute left-0 top-0 flex h-8 w-full items-center border-b border-border bg-background z-[5]">
        <div className="flex w-full">
          {Array.from({ length: 60 }).map((_, i) => (
            <div key={i} className="relative h-8 w-20 border-r border-border/50">
              <span className="absolute left-1 top-1 text-[10px] text-muted-foreground">
                {i * 100}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Ruler - Left */}
      <div className="absolute left-0 top-0 flex h-full w-8 flex-col border-r border-border bg-background z-[5]">
        {Array.from({ length: 40 }).map((_, i) => (
          <div key={i} className="relative h-20 w-8 border-b border-border/50">
            <span className="absolute left-1 top-1 rotate-0 text-[10px] text-muted-foreground">
              {i * 100}
            </span>
          </div>
        ))}
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="relative ml-8 mt-8 h-[2000px] w-[5000px] transition-transform"
        style={{
          backgroundImage: `
            linear-gradient(to right, oklch(var(--border) / 0.2) 1px, transparent 1px),
            linear-gradient(to bottom, oklch(var(--border) / 0.2) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px',
          transform: `scale(${zoom / 100})`,
          transformOrigin: 'top left',
        }}
      >
        {shapes.map((shape) => (
          <div
            key={shape.id}
            className={`absolute ${isDragging && selectedShape === shape.id ? 'cursor-grabbing' : 'cursor-grab'} ${
              selectedShape === shape.id ? 'ring-2 ring-primary' : ''
            }`}
            style={{
              left: shape.x,
              top: shape.y,
              width: shape.width,
              height: shape.height,
              transform: `rotate(${shape.rotation}deg)`,
            }}
            onMouseDown={(e) => handleMouseDown(e, shape.id)}
          >
            <svg
              viewBox="0 0 500 300"
              className="h-full w-full"
              style={{ overflow: 'visible' }}
            >
              <rect
                x="10"
                y="10"
                width="480"
                height="280"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                rx="15"
              />
              
              <g transform="translate(50, 30)">
                <ellipse cx="60" cy="50" rx="45" ry="35" fill="none" stroke="currentColor" strokeWidth="2" />
                <path d="M 15 50 Q 25 30, 40 40" fill="none" stroke="currentColor" strokeWidth="2" />
                <path d="M 80 40 Q 95 30, 105 50" fill="none" stroke="currentColor" strokeWidth="2" />
                <rect x="35" y="65" width="50" height="15" rx="5" fill="none" stroke="currentColor" strokeWidth="2" />
              </g>

              <g transform="translate(390, 30)">
                <ellipse cx="60" cy="50" rx="45" ry="35" fill="none" stroke="currentColor" strokeWidth="2" />
                <path d="M 15 50 Q 25 30, 40 40" fill="none" stroke="currentColor" strokeWidth="2" />
                <path d="M 80 40 Q 95 30, 105 50" fill="none" stroke="currentColor" strokeWidth="2" />
                <rect x="35" y="65" width="50" height="15" rx="5" fill="none" stroke="currentColor" strokeWidth="2" />
              </g>

              <g transform="translate(50, 200)">
                <ellipse cx="60" cy="50" rx="45" ry="35" fill="none" stroke="currentColor" strokeWidth="2" />
                <path d="M 15 50 Q 25 30, 40 40" fill="none" stroke="currentColor" strokeWidth="2" />
                <path d="M 80 40 Q 95 30, 105 50" fill="none" stroke="currentColor" strokeWidth="2" />
                <rect x="35" y="65" width="50" height="15" rx="5" fill="none" stroke="currentColor" strokeWidth="2" />
              </g>

              <g transform="translate(390, 200)">
                <ellipse cx="60" cy="50" rx="45" ry="35" fill="none" stroke="currentColor" strokeWidth="2" />
                <path d="M 15 50 Q 25 30, 40 40" fill="none" stroke="currentColor" strokeWidth="2" />
                <path d="M 80 40 Q 95 30, 105 50" fill="none" stroke="currentColor" strokeWidth="2" />
                <rect x="35" y="65" width="50" height="15" rx="5" fill="none" stroke="currentColor" strokeWidth="2" />
              </g>
            </svg>

            {selectedShape === shape.id && (
              <>
                <div className="absolute -left-1 -top-1 h-3 w-3 rounded-full bg-primary" />
                <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-primary" />
                <div className="absolute -bottom-1 -left-1 h-3 w-3 rounded-full bg-primary" />
                <div className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-primary" />
                <div className="absolute -top-1 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-primary" />
                <div className="absolute -bottom-1 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-primary" />
                <div className="absolute -left-1 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-primary" />
                <div className="absolute -right-1 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-primary" />
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
