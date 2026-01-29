'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { X, ChevronDown } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'

interface EditorPropertiesProps {
  onClose: () => void
}

export function EditorProperties({ onClose }: EditorPropertiesProps) {
  return (
    <aside className="w-80 border-l border-border bg-background">
      <div className="flex h-12 items-center justify-between border-b border-border px-4">
        <h3 className="font-semibold">Properties</h3>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="h-[calc(100vh-7rem)]">
        <div className="space-y-6 p-4">
          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Dimensions</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="x" className="text-xs">
                  X
                </Label>
                <div className="flex items-center gap-2">
                  <Input id="x" value="-5..." className="h-8 text-xs" />
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="y" className="text-xs">
                  Y
                </Label>
                <div className="flex items-center gap-2">
                  <Input id="y" value="322" className="h-8 text-xs" />
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="w" className="text-xs">
                  W
                </Label>
                <div className="flex items-center gap-2">
                  <Input id="w" value="792" className="h-8 text-xs" />
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="h" className="text-xs">
                  H
                </Label>
                <div className="flex items-center gap-2">
                  <Input id="h" value="439" className="h-8 text-xs" />
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="rotation" className="text-xs">
                  Rotation
                </Label>
                <div className="flex items-center gap-2">
                  <Input id="rotation" value="0" className="h-8 text-xs" />
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="flex-1 text-xs bg-transparent">
                <span className="text-primary">🔗</span> INSERT LINK
              </Button>
              <Button size="sm" variant="outline" className="flex-1 text-xs bg-transparent">
                <span className="text-primary">🖼️</span> INSERT IMAGE
              </Button>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h4 className="text-sm font-semibold">Background color</h4>
            <div className="flex items-center gap-2">
              <div className="h-8 w-12 rounded border border-border bg-background" />
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label className="text-xs">Border Type</Label>
                <Select defaultValue="solid">
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="solid">Solid</SelectItem>
                    <SelectItem value="dashed">Dashed</SelectItem>
                    <SelectItem value="dotted">Dotted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Color</Label>
                <div className="flex h-8 items-center justify-center rounded border border-border">
                  <div className="h-4 w-4 rounded-sm bg-foreground" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Thickness</Label>
                <Input defaultValue="1..." className="h-8 text-xs" />
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Opacity</Label>
              <span className="text-xs font-medium">100%</span>
            </div>
            <Slider defaultValue={[100]} max={100} step={1} className="w-full" />
          </div>
        </div>
      </ScrollArea>
    </aside>
  )
}
