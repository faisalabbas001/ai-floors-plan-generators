import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, Play } from 'lucide-react'
import Image from 'next/image'

export function Hero() {
  return (
    <section className="container mx-auto px-4 py-16 md:py-24">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold leading-tight tracking-tight md:text-5xl lg:text-6xl">
              Floor Plan Design{' '}
              <span className="text-primary">Made Simple</span>
            </h1>
            <p className="text-lg text-muted-foreground md:text-xl">
              Design and draw floor plans online in minutes — free, accurate, and easy to use. Plan layouts, rooms, and renovations effortlessly with Floor Plan AI.
            </p>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row">
            <Button size="lg" className="gap-2" asChild>
              <Link href="/generator">
                Start Your Floor Plan <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="gap-2 bg-transparent">
              <Play className="h-4 w-4" />
              Try Drawing Online
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-muted-foreground">10,000+ Happy Users</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <span className="text-muted-foreground">50,000+ Floor Plans Created</span>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="relative overflow-hidden rounded-2xl bg-muted shadow-2xl">
            <div className="relative aspect-[4/3]">
              <Image
                src="/images/image.png"
                alt="Floor plan before and after comparison"
                fill
                className="object-contain p-8"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
