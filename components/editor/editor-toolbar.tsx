'use client'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Save,
  Undo2,
  Redo2,
  MousePointer2,
  Square,
  Type,
  Copy,
  Trash2,
  Menu,
  Grid3x3,
  Eye,
  Plus,
  Layers,
  DoorOpen,
  PanelTop,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useEditorStore, EditorTool } from '@/lib/stores/editor-store'

interface EditorToolbarProps {
  selectedTool: string
  onToolChange: (tool: string) => void
}

export function EditorToolbar({ selectedTool, onToolChange }: EditorToolbarProps) {
  const {
    floorPlan,
    selectedFloorId,
    selectedRoomId,
    selectedElementId,
    selectedElementType,
    currentTool,
    zoom,
    gridSnap,
    historyIndex,
    history,
    selectFloor,
    setCurrentTool,
    deleteRoom,
    deleteDoor,
    deleteWindow,
    undo,
    redo,
    toggleGridSnap,
    setZoom,
  } = useEditorStore()

  const mainTools = [
    { id: 'select', icon: MousePointer2, label: 'Select (V)' },
    { id: 'rectangle', icon: Square, label: 'Add Room (R)' },
    { id: 'door', icon: DoorOpen, label: 'Add Door (D) - Click on wall' },
    { id: 'window', icon: PanelTop, label: 'Add Window (W) - Click on wall' },
    { id: 'text', icon: Type, label: 'Add Label (T)' },
  ]

  const canUndo = historyIndex > 0
  const canRedo = historyIndex < history.length - 1

  const handleDeleteSelected = () => {
    if (!selectedFloorId) return

    // Delete door or window if selected
    if (selectedElementId && selectedElementType && selectedRoomId) {
      if (selectedElementType === 'door') {
        deleteDoor(selectedFloorId, selectedRoomId, selectedElementId)
      } else if (selectedElementType === 'window') {
        deleteWindow(selectedFloorId, selectedRoomId, selectedElementId)
      }
      return
    }

    // Delete room if selected
    if (selectedRoomId) {
      deleteRoom(selectedFloorId, selectedRoomId)
    }
  }

  const handleToolChange = (toolId: string) => {
    onToolChange(toolId)
    setCurrentTool(toolId as EditorTool)
  }

  return (
    <div className="flex h-12 sm:h-14 items-center gap-1 sm:gap-2 border-b border-border bg-primary px-2 sm:px-4 overflow-x-auto">
      {/* Plan Name - hidden on small screens */}
      <div className="hidden md:flex items-center gap-1">
        <span className="text-xs sm:text-sm font-medium text-primary-foreground whitespace-nowrap">
          {floorPlan?.buildingType || 'Floor Plan'} Editor
        </span>
        {floorPlan?.totalArea && (
          <span className="text-xs text-primary-foreground/70 ml-2 hidden lg:inline">
            ({floorPlan.totalArea} sq ft)
          </span>
        )}
      </div>

      <Separator orientation="vertical" className="mx-1 sm:mx-2 h-6 bg-primary-foreground/20 hidden md:block" />

      {/* Floor Selector */}
      {floorPlan && floorPlan.floors.length > 0 && (
        <>
          <div className="flex items-center gap-1 sm:gap-2">
            <Layers className="h-3.5 sm:h-4 w-3.5 sm:w-4 text-primary-foreground/70" />
            <Select
              value={selectedFloorId || undefined}
              onValueChange={(value) => selectFloor(value)}
            >
              <SelectTrigger className="h-7 sm:h-8 w-[100px] sm:w-[140px] bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground text-[10px] sm:text-xs">
                <SelectValue placeholder="Floor" />
              </SelectTrigger>
              <SelectContent>
                {floorPlan.floors.map((floor) => (
                  <SelectItem key={floor.id} value={floor.id}>
                    {floor.level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Separator orientation="vertical" className="mx-1 sm:mx-2 h-6 bg-primary-foreground/20" />
        </>
      )}

      {/* Undo/Redo */}
      <div className="flex items-center gap-0.5 sm:gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 sm:h-8 sm:w-8 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground disabled:opacity-50"
          onClick={undo}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 sm:h-8 sm:w-8 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground disabled:opacity-50"
          onClick={redo}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="mx-1 sm:mx-2 h-6 bg-primary-foreground/20" />

      {/* Main Tools */}
      <div className="flex items-center gap-0.5 sm:gap-1">
        {mainTools.map((tool) => {
          const Icon = tool.icon
          const isActive = currentTool === tool.id
          return (
            <Button
              key={tool.id}
              variant="ghost"
              size="icon"
              title={tool.label}
              className={`h-7 w-7 sm:h-8 sm:w-8 ${
                isActive
                  ? 'bg-primary-foreground/20 text-primary-foreground'
                  : 'text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground'
              }`}
              onClick={() => handleToolChange(tool.id)}
            >
              <Icon className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
            </Button>
          )
        })}
      </div>

      {/* Tool hint when door/window/furniture tool is active - hidden on small screens */}
      {(currentTool === 'door' || currentTool === 'window' || currentTool === 'double-door' || currentTool === 'sliding-door') && (
        <span className="hidden md:inline text-[10px] sm:text-xs text-primary-foreground/80 ml-1 sm:ml-2 whitespace-nowrap">
          Click wall to add {currentTool.replace('-', ' ')}
        </span>
      )}
      {currentTool === 'furniture' && (
        <span className="hidden md:inline text-[10px] sm:text-xs text-primary-foreground/80 ml-1 sm:ml-2 whitespace-nowrap">
          Click room to add furniture
        </span>
      )}

      <div className="ml-auto flex items-center gap-1 sm:gap-2">
        {/* Grid Snap Toggle */}
        <Button
          variant="ghost"
          size="sm"
          className={`h-7 sm:h-8 gap-1 px-2 sm:px-3 ${
            gridSnap
              ? 'bg-primary-foreground/20 text-primary-foreground'
              : 'text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground'
          }`}
          onClick={toggleGridSnap}
        >
          <Grid3x3 className="h-3 sm:h-3.5 w-3 sm:w-3.5" />
          <span className="text-[10px] sm:text-xs hidden sm:inline">Snap</span>
        </Button>

        <Separator orientation="vertical" className="h-6 bg-primary-foreground/20 hidden sm:block" />

        {/* Zoom Control - hidden on very small screens */}
        <div className="hidden sm:flex items-center gap-1 rounded bg-background px-2 sm:px-3 py-1">
          <Eye className="h-3 sm:h-3.5 w-3 sm:w-3.5 text-muted-foreground" />
          <Select value={zoom.toString()} onValueChange={(v) => setZoom(Number(v))}>
            <SelectTrigger className="h-6 w-[55px] sm:w-[70px] border-0 p-0 text-[10px] sm:text-xs font-medium bg-transparent">
              <span className="text-foreground">{zoom}%</span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="50">50%</SelectItem>
              <SelectItem value="75">75%</SelectItem>
              <SelectItem value="100">100%</SelectItem>
              <SelectItem value="125">125%</SelectItem>
              <SelectItem value="150">150%</SelectItem>
              <SelectItem value="200">200%</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* More Options */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 sm:h-8 sm:w-8 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              <Menu className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem className="gap-2" disabled={!selectedRoomId}>
              <Copy className="h-4 w-4" />
              Duplicate Room
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 text-destructive"
              disabled={!selectedRoomId && !selectedElementId}
              onClick={handleDeleteSelected}
            >
              <Trash2 className="h-4 w-4" />
              {selectedElementId ? `Delete ${selectedElementType === 'door' ? 'Door' : 'Window'}` : 'Delete Room'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
