'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Sparkles, PenTool, Home, Wand2 } from 'lucide-react'
import Image from 'next/image'

export function FloorPlanGenerator() {
  const [prompt, setPrompt] = useState(
    'Create a floor plan with three bedrooms, a living room, an open kitchen, and two bathrooms. One bathroom is in the master bedroom, and the other two bedrooms share another bathroom.'
  )
  const [selectedStyle, setSelectedStyle] = useState('technical')
  const [selectedRatio, setSelectedRatio] = useState('16:9')
  const [selectedModel, setSelectedModel] = useState('basic')
  const [activeTab, setActiveTab] = useState('generator')

  const styles = [
    { id: 'technical', name: 'Technical', preview: '/images/style-technical.png' },
    { id: '2.5d', name: '2.5D', preview: '/images/style-2-5d.png' },
    { id: '3d', name: '3D Isometric', preview: '/images/style-3d.png' },
  ]

  const ratios = ['16:9', '9:16', '1:1', '4:3']

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8">
        <p className="text-center text-muted-foreground">
          Generate, edit, and customize detailed floor plans effortlessly.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex justify-center">
          <TabsList className="grid w-full max-w-2xl grid-cols-3">
            <TabsTrigger value="generator" className="gap-2">
              <Sparkles className="h-4 w-4" />
              <span>Floor Plan Generator</span>
            </TabsTrigger>
            <TabsTrigger value="editor" className="gap-2">
              <PenTool className="h-4 w-4" />
              <span>Floor Plan Editor</span>
            </TabsTrigger>
            <TabsTrigger value="design" className="gap-2">
              <Home className="h-4 w-4" />
              <span>Home Design</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="generator" className="mt-8">
          <div className="grid gap-6 lg:grid-cols-[1fr,1.2fr]">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Sparkles className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle>AI Generate Floor Plan</CardTitle>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Create professional floor plans based on your requirements
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="prompt">Prompt</Label>
                    <Textarea
                      id="prompt"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="min-h-[120px] resize-none"
                      placeholder="Describe your floor plan requirements..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Style</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {styles.map((style) => (
                        <button
                          key={style.id}
                          onClick={() => setSelectedStyle(style.id)}
                          className={`group relative overflow-hidden rounded-lg border-2 transition-all ${
                            selectedStyle === style.id
                              ? 'border-primary'
                              : 'border-border hover:border-muted-foreground'
                          }`}
                        >
                          <div className="aspect-square bg-muted p-2">
                            <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                              {style.name}
                            </div>
                          </div>
                          {selectedStyle === style.id && (
                            <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                              <svg
                                className="h-3 w-3 text-primary-foreground"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={3}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            </div>
                          )}
                          <div className="border-t border-border bg-card p-2 text-center text-xs font-medium">
                            {style.name}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Aspect Ratio</Label>
                      <button className="text-xs text-primary hover:underline">Show More</button>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {ratios.map((ratio) => (
                        <Button
                          key={ratio}
                          variant={selectedRatio === ratio ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedRatio(ratio)}
                          className="w-full"
                        >
                          {ratio}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Model</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant={selectedModel === 'basic' ? 'default' : 'outline'}
                        onClick={() => setSelectedModel('basic')}
                        className="h-auto flex-col items-start gap-1 py-3"
                      >
                        <span className="font-semibold">Basic</span>
                        <span className="text-xs font-normal opacity-80">Fast generation</span>
                      </Button>
                      <Button
                        variant={selectedModel === 'pro' ? 'default' : 'outline'}
                        onClick={() => setSelectedModel('pro')}
                        className="h-auto flex-col items-start gap-1 py-3"
                      >
                        <span className="font-semibold">Pro</span>
                        <span className="text-xs font-normal opacity-80">High quality</span>
                      </Button>
                    </div>
                  </div>

                  <Button className="w-full gap-2" size="lg">
                    <Wand2 className="h-4 w-4" />
                    Generate Floor Plan
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div>
              <Card>
                <CardHeader>
                  <Tabs defaultValue="preview" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="preview">Preview</TabsTrigger>
                      <TabsTrigger value="history">History</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </CardHeader>
                <CardContent>
                  <div className="relative aspect-square overflow-hidden rounded-lg border border-border bg-muted">
                    <div className="flex h-full items-center justify-center p-8">
                      <div className="text-center">
                        <Sparkles className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Your generated floor plan will appear here
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="editor" className="mt-8">
          <Card>
            <CardContent className="flex min-h-[500px] items-center justify-center p-12">
              <div className="text-center">
                <PenTool className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-xl font-semibold">Floor Plan Editor</h3>
                <p className="mb-6 text-muted-foreground">
                  Draw and edit floor plans with professional tools
                </p>
                <Button>Open Editor</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="design" className="mt-8">
          <Card>
            <CardContent className="flex min-h-[500px] items-center justify-center p-12">
              <div className="text-center">
                <Home className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-xl font-semibold">Home Design</h3>
                <p className="mb-6 text-muted-foreground">
                  Transform floor plans into stunning 3D visualizations
                </p>
                <Button>Start Designing</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
