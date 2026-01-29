import { Navigation } from '@/components/navigation'
import { FloorPlanGenerator } from '@/components/generator/floor-plan-generator'

export default function GeneratorPage() {
  return (
    <div className="min-h-screen">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <FloorPlanGenerator />
      </main>
    </div>
  )
}
