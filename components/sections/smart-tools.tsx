import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Sparkles, PenTool, Home } from 'lucide-react'
import Image from 'next/image'

export function SmartTools() {
  return (
    <section className="border-y border-border bg-muted/30 py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
            Smart Floor Plan Tools for Every Design Stage
          </h2>
          <p className="text-lg text-muted-foreground">
            Generate, edit, and customize detailed floor plans effortlessly.
          </p>
        </div>

        <Tabs defaultValue="generator" className="mx-auto mt-12 max-w-6xl">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="generator" className="gap-2">
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Floor Plan Generator</span>
              <span className="sm:hidden">Generator</span>
            </TabsTrigger>
            <TabsTrigger value="editor" className="gap-2">
              <PenTool className="h-4 w-4" />
              <span className="hidden sm:inline">Floor Plan Editor</span>
              <span className="sm:hidden">Editor</span>
            </TabsTrigger>
            <TabsTrigger value="design" className="gap-2">
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Home Design</span>
              <span className="sm:hidden">Design</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generator" className="mt-8">
            <Card>
              <CardContent className="grid gap-8 p-6 md:grid-cols-2 md:p-8">
                <div className="flex flex-col justify-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                      <Sparkles className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-2xl font-bold">AI Generate Floor Plan</h3>
                  </div>
                  <p className="text-muted-foreground">
                    Create professional floor plans based on your requirements
                  </p>
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <p>
                      Our platform is trained on thousands of professional architectural layouts, ensuring both accuracy and creativity. It analyzes proportions and spatial balance to deliver realistic and practical results.
                    </p>
                    <p>
                      You can explore and preview house blueprints effortlessly before finalizing your plan.
                    </p>
                  </div>
                </div>
                <div className="relative aspect-video overflow-hidden rounded-xl bg-muted">
                  <Image
                    src="/images/style2d.png"
                    alt="Floor Plan Generator Preview"
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="editor" className="mt-8">
            <Card>
              <CardContent className="grid gap-8 p-6 md:grid-cols-2 md:p-8">
                <div className="flex flex-col justify-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                      <PenTool className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-2xl font-bold">Interactive Editor</h3>
                  </div>
                  <p className="text-muted-foreground">
                    Draw and customize floor plans with precision tools
                  </p>
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <p>
                      Professional-grade drawing tools let you create detailed floor plans from scratch. Add walls, doors, windows, and furniture with drag-and-drop simplicity.
                    </p>
                    <p>
                      Customize every aspect with precise measurements and styling options.
                    </p>
                  </div>
                </div>
                <div className="relative aspect-video overflow-hidden rounded-xl bg-muted">
                  <Image
                    src="/images/styletechnical.png"
                    alt="Floor Plan Editor Preview"
                    fill
                    className="object-cover"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="design" className="mt-8">
            <Card>
              <CardContent className="grid gap-8 p-6 md:grid-cols-2 md:p-8">
                <div className="flex flex-col justify-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                      <Home className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-2xl font-bold">Home Design Tools</h3>
                  </div>
                  <p className="text-muted-foreground">
                    Visualize your space with interior and exterior design AI
                  </p>
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <p>
                      Transform your floor plans into stunning 3D visualizations. Our AI helps you experiment with different styles, materials, and color schemes.
                    </p>
                    <p>
                      See your design come to life before making any physical changes.
                    </p>
                  </div>
                </div>
                <div className="relative aspect-video overflow-hidden rounded-xl bg-muted">
                  <Image
                    src="/images/style3d.png"
                    alt="3D Home Design Preview"
                    fill
                    className="object-cover"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  )
}
