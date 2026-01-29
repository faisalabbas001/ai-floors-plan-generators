import { Navigation } from '@/components/navigation'
import { Hero } from '@/components/sections/hero'
import { Features } from '@/components/sections/features'
import { SmartTools } from '@/components/sections/smart-tools'
import { FAQ } from '@/components/sections/faq'
import { Footer } from '@/components/sections/footer'

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Navigation />
      <main>
        <Hero />
        <SmartTools />
        <Features />
        <FAQ />
      </main>
      <Footer />
    </div>
  )
}
