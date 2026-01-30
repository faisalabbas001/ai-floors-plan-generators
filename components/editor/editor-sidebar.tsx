'use client'

import React from 'react'
import { useState } from 'react'
import { ChevronDown, Plus, Check } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { useEditorStore, EditorTool, FurnitureElement } from '@/lib/stores/editor-store'

const ROOM_COLORS: Record<string, string> = {
  bedroom: '#E8D5B7',
  'master bedroom': '#D4C4A8',
  bathroom: '#B8D4E8',
  kitchen: '#FFE4B5',
  'living room': '#C8E6C9',
  'dining room': '#FFCCBC',
  office: '#D1C4E9',
  garage: '#CFD8DC',
  hallway: '#F5F5F5',
  closet: '#EFEBE9',
  laundry: '#B3E5FC',
}

export function EditorSidebar() {
  const [expandedSection, setExpandedSection] = useState('rooms')
  const {
    floorPlan,
    selectedFloorId,
    selectedRoomId,
    addRoom,
    scale,
    currentTool,
    setCurrentTool,
    pendingFurnitureType,
    setPendingFurnitureType,
    addFurniture,
    viewMode
  } = useEditorStore()

  const roomTemplates = [
    { name: 'Bedroom', type: 'bedroom', defaultSize: { width: 12, height: 12 } },
    { name: 'Master Bedroom', type: 'master bedroom', defaultSize: { width: 15, height: 14 } },
    { name: 'Bathroom', type: 'bathroom', defaultSize: { width: 8, height: 6 } },
    { name: 'Kitchen', type: 'kitchen', defaultSize: { width: 12, height: 10 } },
    { name: 'Living Room', type: 'living room', defaultSize: { width: 16, height: 14 } },
    { name: 'Dining Room', type: 'dining room', defaultSize: { width: 12, height: 10 } },
    { name: 'Office', type: 'office', defaultSize: { width: 10, height: 10 } },
    { name: 'Garage', type: 'garage', defaultSize: { width: 20, height: 20 } },
    { name: 'Hallway', type: 'hallway', defaultSize: { width: 8, height: 4 } },
    { name: 'Closet', type: 'closet', defaultSize: { width: 4, height: 6 } },
    { name: 'Laundry', type: 'laundry', defaultSize: { width: 6, height: 6 } },
  ]

  // Walls & Doors items with tool mapping
  const wallDoorItems: { name: string; icon: string; tool: EditorTool }[] = [
    { name: 'Wall', icon: '━', tool: 'wall' },
    { name: 'Door', icon: '┘', tool: 'door' },
    { name: 'Window', icon: '▭', tool: 'window' },
    { name: 'Double Door', icon: '◙', tool: 'double-door' },
    { name: 'Sliding Door', icon: '∥', tool: 'sliding-door' },
    { name: 'Arch', icon: '⌒', tool: 'arch' },
  ]

  // Furniture items with type and default sizes
  const furnitureItems: { name: string; icon: string; type: FurnitureElement['type']; defaultSize: { width: number; height: number } }[] = [
    { name: 'Bed', icon: '▬', type: 'bed', defaultSize: { width: 60, height: 75 } },
    { name: 'Sofa', icon: '▬', type: 'sofa', defaultSize: { width: 80, height: 35 } },
    { name: 'Table', icon: '▢', type: 'table', defaultSize: { width: 60, height: 40 } },
    { name: 'Chair', icon: '◙', type: 'chair', defaultSize: { width: 20, height: 20 } },
    { name: 'Desk', icon: '▭', type: 'desk', defaultSize: { width: 50, height: 28 } },
    { name: 'Cabinet', icon: '▯', type: 'cabinet', defaultSize: { width: 40, height: 25 } },
    { name: 'Wardrobe', icon: '▦', type: 'wardrobe', defaultSize: { width: 45, height: 25 } },
    { name: 'Toilet', icon: '○', type: 'toilet', defaultSize: { width: 24, height: 30 } },
    { name: 'Sink', icon: '◎', type: 'sink', defaultSize: { width: 35, height: 25 } },
    { name: 'Bathtub', icon: '▭', type: 'bathtub', defaultSize: { width: 65, height: 30 } },
    { name: 'Shower', icon: '▤', type: 'shower', defaultSize: { width: 40, height: 40 } },
    { name: 'Stove', icon: '▣', type: 'stove', defaultSize: { width: 30, height: 30 } },
    { name: 'Fridge', icon: '▥', type: 'fridge', defaultSize: { width: 35, height: 45 } },
  ]

  const sections = [
    {
      id: 'rooms',
      name: 'Add Rooms',
      items: roomTemplates,
    },
    {
      id: 'walls',
      name: 'Walls & Doors',
      items: wallDoorItems,
    },
    {
      id: 'furniture',
      name: 'Furniture',
      items: furnitureItems,
    },
  ]

  const handleWallDoorClick = (tool: EditorTool) => {
    setCurrentTool(tool)
    setPendingFurnitureType(null)
  }

  const handleFurnitureClick = (item: typeof furnitureItems[0]) => {
    if (!selectedFloorId || !selectedRoomId) {
      // Just set the tool mode - will place when clicking on a room
      setCurrentTool('furniture')
      setPendingFurnitureType(item.type)
      return
    }

    // Add furniture directly to the selected room's center
    addFurniture(selectedFloorId, selectedRoomId, {
      type: item.type,
      x: 50, // Center of room (will be adjusted in canvas)
      y: 50,
      width: item.defaultSize.width,
      height: item.defaultSize.height,
      rotation: 0,
    })
    setCurrentTool('select')
  }

  const handleAddRoom = (template: typeof roomTemplates[0]) => {
    if (!selectedFloorId) return

    const widthPx = template.defaultSize.width * scale
    const heightPx = template.defaultSize.height * scale
    const areaSqft = template.defaultSize.width * template.defaultSize.height

    addRoom(selectedFloorId, {
      name: template.name,
      type: template.type,
      x: 100 + Math.random() * 200,
      y: 100 + Math.random() * 200,
      width: widthPx,
      height: heightPx,
      length: template.defaultSize.height,
      areaSqft,
      color: ROOM_COLORS[template.type] || '#E0E0E0',
      features: [],
      rotation: 0,
    })
  }

  const handleDragStart = (e: React.DragEvent, itemName: string) => {
    e.dataTransfer.setData('itemType', itemName)
    e.dataTransfer.effectAllowed = 'copy'
  }

  return (
    <aside className="w-full lg:w-52 border-r border-border bg-background h-full">
      <ScrollArea className="h-[calc(100vh-8rem)] lg:h-full">
        <div className="p-2">
          {/* Current Floor Info */}
          {floorPlan && (
            <div className="mb-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-xs font-semibold text-muted-foreground mb-1">Current Plan</p>
              <p className="text-sm font-medium">{floorPlan.buildingType}</p>
              {floorPlan.totalArea && (
                <p className="text-xs text-muted-foreground">{floorPlan.totalArea} sq ft total</p>
              )}
            </div>
          )}

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
                <div className="mt-1 space-y-1 px-2">
                  {section.id === 'rooms' ? (
                    // Room templates with add button
                    roomTemplates.map((template) => (
                      <button
                        key={template.type}
                        onClick={() => handleAddRoom(template)}
                        disabled={!selectedFloorId}
                        className="flex w-full items-center justify-between px-3 py-2 rounded-md text-sm transition-colors hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: ROOM_COLORS[template.type] }}
                          />
                          <span>{template.name}</span>
                        </div>
                        <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    ))
                  ) : section.id === 'walls' ? (
                    // Walls & Doors with tool activation
                    <div className="grid grid-cols-3 gap-1">
                      {wallDoorItems.map((item) => {
                        const isActive = currentTool === item.tool
                        return (
                          <button
                            key={item.name}
                            onClick={() => handleWallDoorClick(item.tool)}
                            disabled={!selectedFloorId || viewMode !== '2d'}
                            className={`flex aspect-square flex-col items-center justify-center gap-1 rounded border p-1 text-xs transition-colors
                              ${isActive
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-border bg-card hover:border-primary hover:bg-accent'}
                              ${(!selectedFloorId || viewMode !== '2d') ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                            title={`${item.name}${viewMode !== '2d' ? ' (Switch to 2D view)' : ''}`}
                          >
                            <div className={`text-lg font-bold ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                              {item.icon}
                            </div>
                            <div className={`text-[9px] leading-tight text-center line-clamp-2 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                              {item.name}
                            </div>
                            {isActive && (
                              <Check className="absolute top-1 right-1 h-3 w-3 text-primary" />
                            )}
                          </button>
                        )
                      })}
                    </div>
                  ) : section.id === 'furniture' ? (
                    // Furniture with click to add
                    <div className="grid grid-cols-3 gap-1">
                      {furnitureItems.map((item) => {
                        const isActive = currentTool === 'furniture' && pendingFurnitureType === item.type
                        return (
                          <button
                            key={item.name}
                            onClick={() => handleFurnitureClick(item)}
                            disabled={!selectedFloorId || viewMode !== '2d'}
                            className={`relative flex aspect-square flex-col items-center justify-center gap-1 rounded border p-1 text-xs transition-colors
                              ${isActive
                                ? 'border-primary bg-primary/10 text-primary'
                                : 'border-border bg-card hover:border-primary hover:bg-accent'}
                              ${(!selectedFloorId || viewMode !== '2d') ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                            title={selectedRoomId
                              ? `Add ${item.name} to selected room`
                              : `Select ${item.name} tool (then click on a room)`}
                          >
                            <div className={`text-lg font-bold ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                              {item.icon}
                            </div>
                            <div className={`text-[9px] leading-tight text-center line-clamp-2 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                              {item.name}
                            </div>
                            {isActive && (
                              <Check className="absolute top-1 right-1 h-3 w-3 text-primary" />
                            )}
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    // Fallback for other sections
                    <div className="grid grid-cols-3 gap-1">
                      {section.items.map((item: any) => (
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
              )}
            </div>
          ))}

          {/* Help text */}
          {!floorPlan && (
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-900">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Generate a floor plan first to start adding and editing rooms.
              </p>
            </div>
          )}

          {/* View mode hint */}
          {floorPlan && viewMode !== '2d' && (
            <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-900">
              <p className="text-xs text-amber-700 dark:text-amber-300">
                Switch to <strong>2D view</strong> to add and edit doors, windows, and furniture.
              </p>
            </div>
          )}

          {/* Furniture placement hint */}
          {currentTool === 'furniture' && pendingFurnitureType && !selectedRoomId && (
            <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-900">
              <p className="text-xs text-green-700 dark:text-green-300">
                Click on a room to add the selected furniture item.
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </aside>
  )
}
