'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { X, RotateCw, Trash2 } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { useEditorStore, Room, DoorElement, WindowElement, WallSide, TextElement } from '@/lib/stores/editor-store'

interface EditorPropertiesProps {
  onClose: () => void
}

const ROOM_TYPES = [
  { value: 'bedroom', label: 'Bedroom' },
  { value: 'master bedroom', label: 'Master Bedroom' },
  { value: 'bathroom', label: 'Bathroom' },
  { value: 'kitchen', label: 'Kitchen' },
  { value: 'living room', label: 'Living Room' },
  { value: 'dining room', label: 'Dining Room' },
  { value: 'office', label: 'Office' },
  { value: 'garage', label: 'Garage' },
  { value: 'hallway', label: 'Hallway' },
  { value: 'closet', label: 'Closet' },
  { value: 'laundry', label: 'Laundry' },
]

const DOOR_TYPES = [
  { value: 'single', label: 'Single Door' },
  { value: 'double', label: 'Double Door' },
  { value: 'sliding', label: 'Sliding Door' },
]

const WINDOW_TYPES = [
  { value: 'single', label: 'Single Pane' },
  { value: 'double', label: 'Double Pane' },
  { value: 'sliding', label: 'Sliding Window' },
  { value: 'bay', label: 'Bay Window' },
]

const WALL_SIDES: { value: WallSide; label: string }[] = [
  { value: 'north', label: 'North' },
  { value: 'south', label: 'South' },
  { value: 'east', label: 'East' },
  { value: 'west', label: 'West' },
]

export function EditorProperties({ onClose }: EditorPropertiesProps) {
  const {
    floorPlan,
    selectedFloorId,
    selectedRoomId,
    selectedElementId,
    selectedElementType,
    selectedTextId,
    scale,
    updateRoom,
    deleteRoom,
    updateDoor,
    deleteDoor,
    updateWindow,
    deleteWindow,
    updateText,
    deleteText,
    selectElement,
    selectText,
  } = useEditorStore()

  // Find selected room
  const currentFloor = floorPlan?.floors.find((f) => f.id === selectedFloorId)
  const selectedRoom = currentFloor?.rooms.find((r) => r.id === selectedRoomId)

  // Find selected door or window
  const selectedDoor = selectedRoom?.doors?.find((d) => d.id === selectedElementId)
  const selectedWindow = selectedRoom?.windows?.find((w) => w.id === selectedElementId)

  // Find selected text
  const selectedText = currentFloor?.texts?.find((t) => t.id === selectedTextId)

  // Local state for editing
  const [localRoom, setLocalRoom] = useState<Partial<Room>>({})
  const [localDoor, setLocalDoor] = useState<Partial<DoorElement>>({})
  const [localWindow, setLocalWindow] = useState<Partial<WindowElement>>({})
  const [localText, setLocalText] = useState<Partial<TextElement>>({})

  // Sync local state with selected room
  useEffect(() => {
    if (selectedRoom) {
      setLocalRoom({
        name: selectedRoom.name,
        type: selectedRoom.type,
        x: selectedRoom.x,
        y: selectedRoom.y,
        width: selectedRoom.width,
        height: selectedRoom.height,
        rotation: selectedRoom.rotation,
        areaSqft: selectedRoom.areaSqft,
      })
    } else {
      setLocalRoom({})
    }
  }, [selectedRoom])

  // Sync local state with selected door
  useEffect(() => {
    if (selectedDoor) {
      setLocalDoor({
        wall: selectedDoor.wall,
        position: selectedDoor.position,
        width: selectedDoor.width,
        type: selectedDoor.type,
        swingDirection: selectedDoor.swingDirection,
        swingSide: selectedDoor.swingSide,
      })
    } else {
      setLocalDoor({})
    }
  }, [selectedDoor])

  // Sync local state with selected window
  useEffect(() => {
    if (selectedWindow) {
      setLocalWindow({
        wall: selectedWindow.wall,
        position: selectedWindow.position,
        width: selectedWindow.width,
        type: selectedWindow.type,
      })
    } else {
      setLocalWindow({})
    }
  }, [selectedWindow])

  // Sync local state with selected text
  useEffect(() => {
    if (selectedText) {
      setLocalText({
        text: selectedText.text,
        fontSize: selectedText.fontSize,
        fontStyle: selectedText.fontStyle,
        fill: selectedText.fill,
        x: selectedText.x,
        y: selectedText.y,
        rotation: selectedText.rotation,
      })
    } else {
      setLocalText({})
    }
  }, [selectedText])

  const handleInputChange = (field: keyof Room, value: string | number) => {
    setLocalRoom((prev) => ({ ...prev, [field]: value }))
  }

  const handleInputBlur = (field: keyof Room) => {
    if (selectedFloorId && selectedRoomId && localRoom[field] !== undefined) {
      const updates: Partial<Room> = { [field]: localRoom[field] }

      // Recalculate area if dimensions changed
      if (field === 'width' || field === 'height') {
        const newWidth = field === 'width' ? Number(localRoom[field]) : selectedRoom?.width || 0
        const newHeight = field === 'height' ? Number(localRoom[field]) : selectedRoom?.height || 0
        updates.areaSqft = Math.round((newWidth / scale) * (newHeight / scale))
      }

      updateRoom(selectedFloorId, selectedRoomId, updates)
    }
  }

  const handleDelete = () => {
    if (selectedFloorId && selectedRoomId) {
      deleteRoom(selectedFloorId, selectedRoomId)
    }
  }

  const handleRotate = () => {
    if (selectedFloorId && selectedRoomId && selectedRoom) {
      const newRotation = (selectedRoom.rotation + 90) % 360
      updateRoom(selectedFloorId, selectedRoomId, { rotation: newRotation })
    }
  }

  const handleDoorUpdate = (field: keyof DoorElement, value: any) => {
    setLocalDoor((prev) => ({ ...prev, [field]: value }))
    if (selectedFloorId && selectedRoomId && selectedElementId) {
      updateDoor(selectedFloorId, selectedRoomId, selectedElementId, { [field]: value })
    }
  }

  const handleDeleteDoor = () => {
    if (selectedFloorId && selectedRoomId && selectedElementId) {
      deleteDoor(selectedFloorId, selectedRoomId, selectedElementId)
      selectElement(null, null)
    }
  }

  const handleWindowUpdate = (field: keyof WindowElement, value: any) => {
    setLocalWindow((prev) => ({ ...prev, [field]: value }))
    if (selectedFloorId && selectedRoomId && selectedElementId) {
      updateWindow(selectedFloorId, selectedRoomId, selectedElementId, { [field]: value })
    }
  }

  const handleDeleteWindow = () => {
    if (selectedFloorId && selectedRoomId && selectedElementId) {
      deleteWindow(selectedFloorId, selectedRoomId, selectedElementId)
      selectElement(null, null)
    }
  }

  const handleTextUpdate = (field: keyof TextElement, value: any) => {
    setLocalText((prev) => ({ ...prev, [field]: value }))
    if (selectedFloorId && selectedTextId) {
      updateText(selectedFloorId, selectedTextId, { [field]: value })
    }
  }

  const handleDeleteText = () => {
    if (selectedFloorId && selectedTextId) {
      deleteText(selectedFloorId, selectedTextId)
      selectText(null)
    }
  }

  // Show door properties if door is selected
  if (selectedDoor && selectedElementType === 'door') {
    return (
      <aside className="w-full lg:w-80 border-l border-border bg-background h-full">
        <div className="flex h-12 items-center justify-between border-b border-border px-4">
          <h3 className="font-semibold text-sm sm:text-base">Door Properties</h3>
          <Button variant="ghost" size="icon" className="h-6 w-6 lg:hidden" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <ScrollArea className="h-[calc(100vh-12rem)] lg:h-[calc(100vh-9rem)]">
          <div className="space-y-6 p-4 pb-8">
            {/* Door Type */}
            <div className="space-y-2">
              <Label className="text-xs">Door Type</Label>
              <Select
                value={localDoor.type || 'single'}
                onValueChange={(value) => handleDoorUpdate('type', value)}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOOR_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Wall Position */}
            <div className="space-y-2">
              <Label className="text-xs">Wall</Label>
              <Select
                value={localDoor.wall || 'north'}
                onValueChange={(value) => handleDoorUpdate('wall', value as WallSide)}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WALL_SIDES.map((side) => (
                    <SelectItem key={side.value} value={side.value}>
                      {side.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Position along wall */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Position on Wall</Label>
                <span className="text-xs font-medium">{Math.round((localDoor.position || 0.5) * 100)}%</span>
              </div>
              <Slider
                value={[(localDoor.position || 0.5) * 100]}
                min={10}
                max={90}
                step={5}
                className="flex-1"
                onValueChange={([value]) => {
                  setLocalDoor((prev) => ({ ...prev, position: value / 100 }))
                }}
                onValueCommit={([value]) => {
                  handleDoorUpdate('position', value / 100)
                }}
              />
            </div>

            {/* Door Width */}
            <div className="space-y-2">
              <Label htmlFor="doorWidth" className="text-xs">
                Door Width (px)
              </Label>
              <Input
                id="doorWidth"
                type="number"
                value={localDoor.width || 30}
                onChange={(e) => setLocalDoor((prev) => ({ ...prev, width: Number(e.target.value) }))}
                onBlur={() => handleDoorUpdate('width', localDoor.width)}
                className="h-8 text-xs"
              />
            </div>

            <Separator />

            {/* Swing Direction */}
            <div className="space-y-2">
              <Label className="text-xs">Swing Direction</Label>
              <Select
                value={localDoor.swingDirection || 'inward'}
                onValueChange={(value) => handleDoorUpdate('swingDirection', value)}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inward">Inward</SelectItem>
                  <SelectItem value="outward">Outward</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Swing Side */}
            <div className="space-y-2">
              <Label className="text-xs">Swing Side</Label>
              <Select
                value={localDoor.swingSide || 'right'}
                onValueChange={(value) => handleDoorUpdate('swingSide', value)}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left</SelectItem>
                  <SelectItem value="right">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Actions */}
            <div className="space-y-2">
              <Button
                variant="destructive"
                size="sm"
                className="w-full"
                onClick={handleDeleteDoor}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Door
              </Button>
            </div>
          </div>
        </ScrollArea>
      </aside>
    )
  }

  // Show window properties if window is selected
  if (selectedWindow && selectedElementType === 'window') {
    return (
      <aside className="w-full lg:w-80 border-l border-border bg-background h-full">
        <div className="flex h-12 items-center justify-between border-b border-border px-4">
          <h3 className="font-semibold text-sm sm:text-base">Window Properties</h3>
          <Button variant="ghost" size="icon" className="h-6 w-6 lg:hidden" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <ScrollArea className="h-[calc(100vh-12rem)] lg:h-[calc(100vh-9rem)]">
          <div className="space-y-6 p-4 pb-8">
            {/* Window Type */}
            <div className="space-y-2">
              <Label className="text-xs">Window Type</Label>
              <Select
                value={localWindow.type || 'double'}
                onValueChange={(value) => handleWindowUpdate('type', value)}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WINDOW_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Wall Position */}
            <div className="space-y-2">
              <Label className="text-xs">Wall</Label>
              <Select
                value={localWindow.wall || 'north'}
                onValueChange={(value) => handleWindowUpdate('wall', value as WallSide)}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WALL_SIDES.map((side) => (
                    <SelectItem key={side.value} value={side.value}>
                      {side.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Position along wall */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Position on Wall</Label>
                <span className="text-xs font-medium">{Math.round((localWindow.position || 0.5) * 100)}%</span>
              </div>
              <Slider
                value={[(localWindow.position || 0.5) * 100]}
                min={10}
                max={90}
                step={5}
                className="flex-1"
                onValueChange={([value]) => {
                  setLocalWindow((prev) => ({ ...prev, position: value / 100 }))
                }}
                onValueCommit={([value]) => {
                  handleWindowUpdate('position', value / 100)
                }}
              />
            </div>

            {/* Window Width */}
            <div className="space-y-2">
              <Label htmlFor="windowWidth" className="text-xs">
                Window Width (px)
              </Label>
              <Input
                id="windowWidth"
                type="number"
                value={localWindow.width || 36}
                onChange={(e) => setLocalWindow((prev) => ({ ...prev, width: Number(e.target.value) }))}
                onBlur={() => handleWindowUpdate('width', localWindow.width)}
                className="h-8 text-xs"
              />
            </div>

            <Separator />

            {/* Actions */}
            <div className="space-y-2">
              <Button
                variant="destructive"
                size="sm"
                className="w-full"
                onClick={handleDeleteWindow}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Window
              </Button>
            </div>
          </div>
        </ScrollArea>
      </aside>
    )
  }

  // Show text properties if text is selected
  if (selectedText && selectedElementType === 'text') {
    return (
      <aside className="w-full lg:w-80 border-l border-border bg-background h-full">
        <div className="flex h-12 items-center justify-between border-b border-border px-4">
          <h3 className="font-semibold text-sm sm:text-base">Text Properties</h3>
          <Button variant="ghost" size="icon" className="h-6 w-6 lg:hidden" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <ScrollArea className="h-[calc(100vh-12rem)] lg:h-[calc(100vh-9rem)]">
          <div className="space-y-6 p-4 pb-8">
            {/* Text Content */}
            <div className="space-y-2">
              <Label htmlFor="textContent" className="text-xs">
                Text Content
              </Label>
              <Input
                id="textContent"
                value={localText.text || ''}
                onChange={(e) => setLocalText((prev) => ({ ...prev, text: e.target.value }))}
                onBlur={() => handleTextUpdate('text', localText.text)}
                className="h-8 text-sm"
              />
            </div>

            <Separator />

            {/* Font Size */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Font Size</Label>
                <span className="text-xs font-medium">{localText.fontSize || 14}px</span>
              </div>
              <Slider
                value={[localText.fontSize || 14]}
                min={8}
                max={48}
                step={1}
                className="flex-1"
                onValueChange={([value]) => {
                  setLocalText((prev) => ({ ...prev, fontSize: value }))
                }}
                onValueCommit={([value]) => {
                  handleTextUpdate('fontSize', value)
                }}
              />
            </div>

            {/* Font Style */}
            <div className="space-y-2">
              <Label className="text-xs">Font Style</Label>
              <Select
                value={localText.fontStyle || 'normal'}
                onValueChange={(value) => handleTextUpdate('fontStyle', value)}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="bold">Bold</SelectItem>
                  <SelectItem value="italic">Italic</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Text Color */}
            <div className="space-y-2">
              <Label htmlFor="textColor" className="text-xs">
                Color
              </Label>
              <div className="flex gap-2">
                <Input
                  id="textColor"
                  type="color"
                  value={localText.fill || '#333333'}
                  onChange={(e) => handleTextUpdate('fill', e.target.value)}
                  className="h-8 w-12 p-1 cursor-pointer"
                />
                <Input
                  value={localText.fill || '#333333'}
                  onChange={(e) => setLocalText((prev) => ({ ...prev, fill: e.target.value }))}
                  onBlur={() => handleTextUpdate('fill', localText.fill)}
                  className="h-8 text-xs flex-1"
                />
              </div>
            </div>

            <Separator />

            {/* Position */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold">Position</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="textX" className="text-xs">
                    X Position
                  </Label>
                  <Input
                    id="textX"
                    type="number"
                    value={Math.round(localText.x || 0)}
                    onChange={(e) => setLocalText((prev) => ({ ...prev, x: Number(e.target.value) }))}
                    onBlur={() => handleTextUpdate('x', localText.x)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="textY" className="text-xs">
                    Y Position
                  </Label>
                  <Input
                    id="textY"
                    type="number"
                    value={Math.round(localText.y || 0)}
                    onChange={(e) => setLocalText((prev) => ({ ...prev, y: Number(e.target.value) }))}
                    onBlur={() => handleTextUpdate('y', localText.y)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Rotation */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Rotation</Label>
                <span className="text-xs font-medium">{localText.rotation || 0}°</span>
              </div>
              <div className="flex items-center gap-2">
                <Slider
                  value={[localText.rotation || 0]}
                  max={360}
                  step={15}
                  className="flex-1"
                  onValueChange={([value]) => {
                    setLocalText((prev) => ({ ...prev, rotation: value }))
                  }}
                  onValueCommit={([value]) => {
                    handleTextUpdate('rotation', value)
                  }}
                />
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => {
                    const newRotation = ((localText.rotation || 0) + 90) % 360
                    handleTextUpdate('rotation', newRotation)
                  }}
                  title="Rotate 90°"
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Separator />

            {/* Actions */}
            <div className="space-y-2">
              <Button
                variant="destructive"
                size="sm"
                className="w-full"
                onClick={handleDeleteText}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Text
              </Button>
            </div>
          </div>
        </ScrollArea>
      </aside>
    )
  }

  if (!selectedRoom) {
    return (
      <aside className="w-full lg:w-80 border-l border-border bg-background h-full">
        <div className="flex h-12 items-center justify-between border-b border-border px-4">
          <h3 className="font-semibold text-sm sm:text-base">Properties</h3>
          <Button variant="ghost" size="icon" className="h-6 w-6 lg:hidden" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-col items-center justify-center h-[calc(100vh-14rem)] lg:h-[calc(100vh-10rem)] text-center px-6">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
              />
            </svg>
          </div>
          <h4 className="font-medium mb-1">No Room Selected</h4>
          <p className="text-sm text-muted-foreground">
            Click on a room in the canvas to view and edit its properties
          </p>
        </div>
      </aside>
    )
  }

  return (
    <aside className="w-full lg:w-80 border-l border-border bg-background h-full">
      <div className="flex h-12 items-center justify-between border-b border-border px-4">
        <h3 className="font-semibold text-sm sm:text-base">Room Properties</h3>
        <Button variant="ghost" size="icon" className="h-6 w-6 lg:hidden" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="h-[calc(100vh-12rem)] lg:h-[calc(100vh-9rem)]">
        <div className="space-y-6 p-4 pb-8">
          {/* Room Name & Type */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="roomName" className="text-xs">
                Room Name
              </Label>
              <Input
                id="roomName"
                value={localRoom.name || ''}
                onChange={(e) => handleInputChange('name', e.target.value)}
                onBlur={() => handleInputBlur('name')}
                className="h-8 text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Room Type</Label>
              <Select
                value={localRoom.type || ''}
                onValueChange={(value) => {
                  handleInputChange('type', value)
                  if (selectedFloorId && selectedRoomId) {
                    updateRoom(selectedFloorId, selectedRoomId, { type: value })
                  }
                }}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROOM_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* Dimensions */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Dimensions</h4>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="x" className="text-xs">
                  X Position
                </Label>
                <Input
                  id="x"
                  type="number"
                  value={Math.round(localRoom.x || 0)}
                  onChange={(e) => handleInputChange('x', Number(e.target.value))}
                  onBlur={() => handleInputBlur('x')}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="y" className="text-xs">
                  Y Position
                </Label>
                <Input
                  id="y"
                  type="number"
                  value={Math.round(localRoom.y || 0)}
                  onChange={(e) => handleInputChange('y', Number(e.target.value))}
                  onBlur={() => handleInputBlur('y')}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="width" className="text-xs">
                  Width (px)
                </Label>
                <Input
                  id="width"
                  type="number"
                  value={Math.round(localRoom.width || 0)}
                  onChange={(e) => handleInputChange('width', Number(e.target.value))}
                  onBlur={() => handleInputBlur('width')}
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height" className="text-xs">
                  Height (px)
                </Label>
                <Input
                  id="height"
                  type="number"
                  value={Math.round(localRoom.height || 0)}
                  onChange={(e) => handleInputChange('height', Number(e.target.value))}
                  onBlur={() => handleInputBlur('height')}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Dimensions (ft)</span>
                <span className="text-sm font-medium">
                  {((localRoom.width || 0) / scale).toFixed(1)} x{' '}
                  {((localRoom.height || 0) / scale).toFixed(1)} ft
                </span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-xs text-muted-foreground">Area</span>
                <span className="text-sm font-medium">{localRoom.areaSqft || 0} sq ft</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Rotation */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Rotation</Label>
              <span className="text-xs font-medium">{localRoom.rotation || 0}°</span>
            </div>
            <div className="flex items-center gap-2">
              <Slider
                value={[localRoom.rotation || 0]}
                max={360}
                step={15}
                className="flex-1"
                onValueChange={([value]) => {
                  handleInputChange('rotation', value)
                }}
                onValueCommit={([value]) => {
                  if (selectedFloorId && selectedRoomId) {
                    updateRoom(selectedFloorId, selectedRoomId, { rotation: value })
                  }
                }}
              />
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={handleRotate}
                title="Rotate 90°"
              >
                <RotateCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Separator />

          {/* Doors & Windows */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Doors & Windows</h4>
            <div className="bg-muted/50 rounded-lg p-3 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Doors</span>
                <span className="text-sm font-medium">{selectedRoom.doors?.length || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground">Windows</span>
                <span className="text-sm font-medium">{selectedRoom.windows?.length || 0}</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Use the Door/Window tools in the toolbar to add elements. Click on a wall to place them.
            </p>
          </div>

          <Separator />

          {/* Features */}
          {selectedRoom.features && selectedRoom.features.length > 0 && (
            <>
              <div className="space-y-3">
                <h4 className="text-sm font-semibold">Features</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedRoom.features.map((feature, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-muted"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Actions */}
          <div className="space-y-2">
            <Button
              variant="destructive"
              size="sm"
              className="w-full"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Room
            </Button>
          </div>
        </div>
      </ScrollArea>
    </aside>
  )
}
