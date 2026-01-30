import Link from 'next/link'
import Image from 'next/image'

export function Footer() {
  const footerLinks = {
    'Floor Plan': [
      'Floor Plan Creator',
      'Floor Plan Editor',
      'Floor Plan Designer',
      'Floor Plan to 3D',
      '2D Floor Plan',
      'Floor Plan Generator',
    ],
    'Home Design': [
      'Interior Design AI',
      'Exterior Design AI',
      'Garden Design AI',
      'AI Landscape Design',
    ],
    'AI Tools': [
      'Virtual Staging AI',
      'Sketch to Image AI',
      'Auto Loan Calculator',
      'Area Calculator',
      'Mortgage Calculator',
    ],
    'About Us': ['Privacy Policy', 'Terms of Service', 'Contact Us'],
  }

  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center">
              <Image
                src="/Flowplanlogo.png"
                alt="FloorPlan AI Logo"
                width={500}
                height={500}
                className="h-20 sm:h-24 w-auto"
              />
            </Link>
            <p className="mt-4 text-sm text-muted-foreground">
              Redefining floor plan with AI technology, giving everyone access to professional-grade design experiences.
            </p>
          </div>

          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="mb-4 font-semibold">{category}</h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link}>
                    <Link
                      href="#"
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-border pt-8">
          <div className="flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
            <p>© 2024 Floor Plan AI. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="#" className="hover:text-foreground">
                Twitter
              </Link>
              <Link href="#" className="hover:text-foreground">
                LinkedIn
              </Link>
              <Link href="#" className="hover:text-foreground">
                Instagram
              </Link>
              <Link href="#" className="hover:text-foreground">
                YouTube
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
