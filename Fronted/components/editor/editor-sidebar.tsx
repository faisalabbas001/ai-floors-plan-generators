'use client'

import React from "react"

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'

export function EditorSidebar() {
  const [expandedSection, setExpandedSection] = useState('kitchen')

  const sections = [
    {
      id: 'walls',
      name: 'Walls & Doors',
      items: [
        { name: 'Wall', icon: '━' },
        { name: 'Door', icon: '┘' },
        { name: 'Window', icon: '▭' },
        { name: 'Double Door', icon: '◙' },
        { name: 'Sliding Door', icon: '∥' },
        { name: 'Arch', icon: '⌒' },
      ],
    },
    {
      id: 'kitchen',
      name: 'Kitchen',
      items: [
        { name: 'Stove', icon: '◙' },
        { name: 'Sink', icon: '◐' },
        { name: 'Refrigerator', icon: '▯' },
        { name: 'Dishwasher', icon: '▢' },
        { name: 'Oven', icon: '◫' },
        { name: 'Counter', icon: '▬' },
      ],
    },
    {
      id: 'bedroom',
      name: 'Bed Room',
      items: [
        { name: 'Bed', icon: '▬' },
        { name: 'Nightstand', icon: '▢' },
        { name: 'Dresser', icon: '▭' },
        { name: 'Wardrobe', icon: '▯' },
        { name: 'Mirror', icon: '○' },
        { name: 'Desk', icon: '▬' },
      ],
    },
    {
      id: 'living',
      name: 'Living Room',
      items: [
        { name: 'Sofa', icon: '▬' },
        { name: 'Coffee Table', icon: '▢' },
        { name: 'TV Stand', icon: '▭' },
        { name: 'Armchair', icon: '◙' },
        { name: 'Bookshelf', icon: '▯' },
        { name: 'Rug', icon: '▭' },
      ],
    },
    {
      id: 'bathroom',
      name: 'Bath Room',
      items: [
        { name: 'Toilet', icon: '◙' },
        { name: 'Sink', icon: '◐' },
        { name: 'Bathtub', icon: '▬' },
        { name: 'Shower', icon: '▢' },
        { name: 'Mirror', icon: '○' },
        { name: 'Cabinet', icon: '▯' },
      ],
    },
  ]

  const handleDragStart = (e: React.DragEvent, itemName: string) => {
    e.dataTransfer.setData('itemType', itemName)
    e.dataTransfer.effectAllowed = 'copy'
  }

  return (
    <aside className="w-52 border-r border-border bg-background">
      <ScrollArea className="h-full">
        <div className="p-2">
          {sections.map((section) => (
            <div key={section.id} className="mb-2">
              <Button
                variant="ghost"
                className="w-full justify-between px-3 py-2 text-sm font-medium"
                onClick={() =>
                  setExpandedSection(expandedSection === section.id ? '' : section.id)
                }
              >
                {section.name}
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    expandedSection === section.id ? 'rotate-180' : ''
                  }`}
                />
              </Button>
              {expandedSection === section.id && (
                <div className="mt-1 grid grid-cols-3 gap-1 px-2">
                  {section.items.map((item) => (
                    <button
                      key={item.name}
                      draggable
                      onDragStart={(e) => handleDragStart(e, item.name)}
                      className="flex aspect-square cursor-grab active:cursor-grabbing flex-col items-center justify-center gap-1 rounded border border-border bg-card p-1 text-xs transition-colors hover:border-primary hover:bg-accent"
                      title={item.name}
                    >
                      <div className="text-lg font-bold text-muted-foreground">
                        {item.icon}
                      </div>
                      <div className="text-[9px] leading-tight text-center line-clamp-2 text-muted-foreground">
                        {item.name}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </aside>
  )
}
