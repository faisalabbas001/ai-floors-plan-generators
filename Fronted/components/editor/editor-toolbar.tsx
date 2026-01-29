'use client'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Save,
  FileDown,
  Printer,
  Undo2,
  Redo2,
  MousePointer2,
  Square,
  Type,
  Copy,
  Trash2,
  Lock,
  ZoomIn,
  Eye,
  Menu,
  Grid3x3,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface EditorToolbarProps {
  selectedTool: string
  onToolChange: (tool: string) => void
}

export function EditorToolbar({ selectedTool, onToolChange }: EditorToolbarProps) {
  const mainTools = [
    { id: 'select', icon: MousePointer2, label: 'Select' },
    { id: 'rectangle', icon: Square, label: 'Rectangle' },
    { id: 'text', icon: Type, label: 'Text' },
  ]

  return (
    <div className="flex h-14 items-center gap-2 border-b border-border bg-primary px-4">
      <div className="flex items-center gap-1">
        <span className="text-sm font-medium text-primary-foreground">Floor Plan Example</span>
      </div>

      <Separator orientation="vertical" className="mx-2 h-6 bg-primary-foreground/20" />

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" className="h-8 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
          <span className="text-xs">New</span>
        </Button>
        <Button variant="ghost" size="sm" className="h-8 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
          <span className="text-xs">Open</span>
        </Button>
        <Button variant="ghost" size="sm" className="h-8 gap-1 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
          <Save className="h-3.5 w-3.5" />
          <span className="text-xs">Save</span>
        </Button>
        <Button variant="ghost" size="sm" className="h-8 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
          <span className="text-xs">Export</span>
        </Button>
        <Button variant="ghost" size="sm" className="h-8 gap-1 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
          <Printer className="h-3.5 w-3.5" />
          <span className="text-xs">Print</span>
        </Button>
        <Button variant="ghost" size="sm" className="h-8 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
          <span className="text-xs font-semibold">VIEW</span>
        </Button>
      </div>

      <Separator orientation="vertical" className="mx-2 h-6 bg-primary-foreground/20" />

      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
          <Redo2 className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="mx-2 h-6 bg-primary-foreground/20" />

      <div className="flex items-center gap-1">
        {mainTools.map((tool) => {
          const Icon = tool.icon
          return (
            <Button
              key={tool.id}
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${
                selectedTool === tool.id
                  ? 'bg-primary-foreground/20 text-primary-foreground'
                  : 'text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground'
              }`}
              onClick={() => onToolChange(tool.id)}
            >
              <Icon className="h-4 w-4" />
            </Button>
          )
        })}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 gap-1 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
        >
          <Grid3x3 className="h-3.5 w-3.5" />
          <span className="text-xs">Grid Snap</span>
        </Button>
        
        <Separator orientation="vertical" className="h-6 bg-primary-foreground/20" />
        
        <div className="flex items-center gap-1 rounded bg-background px-3 py-1">
          <Eye className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">100%</span>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground">
              <Menu className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem className="gap-2">
              <Copy className="h-4 w-4" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2">
              <Lock className="h-4 w-4" />
              Lock Selection
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 text-destructive">
              <Trash2 className="h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
