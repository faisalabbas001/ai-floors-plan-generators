import { Cpu, Zap, Ruler, Download, Lock, Cloud } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export function Features() {
  const features = [
    {
      icon: Cpu,
      title: 'Professional Design Engine',
      description:
        'Our platform is trained on thousands of professional architectural layouts, ensuring both accuracy and creativity.',
    },
    {
      icon: Zap,
      title: 'Fast Layout Generation',
      description:
        'Generate detailed floor plans in seconds with our AI-powered engine. No manual drawing required.',
    },
    {
      icon: Ruler,
      title: 'Precise Measurements',
      description:
        'Every element is measured accurately. Export plans with exact dimensions for construction and renovation.',
    },
    {
      icon: Download,
      title: 'Multiple Export Formats',
      description:
        'Download your floor plans as PDF, PNG, or SVG. Print-ready for architects and contractors.',
    },
    {
      icon: Lock,
      title: 'Secure & Private',
      description:
        'Your designs are encrypted and stored securely. We never share your data with third parties.',
    },
    {
      icon: Cloud,
      title: 'Cloud Storage',
      description:
        'Access your floor plans from anywhere. Automatic saving ensures you never lose your work.',
    },
  ]

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
            Smart Layout Design Features
          </h2>
          <p className="text-lg text-muted-foreground">
            Our intelligent system combines automation with professional architectural principles to make planning spaces faster and more creative than ever.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <Card key={index} className="border-border transition-colors hover:border-primary/50">
                <CardContent className="flex flex-col gap-4 p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </section>
  )
}
