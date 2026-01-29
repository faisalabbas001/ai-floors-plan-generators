'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { Layers, ChevronDown, Globe, Menu, X } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Layers className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold">Floor Plan AI</span>
          </Link>
          
          <nav className="hidden items-center gap-6 md:flex">
            <Link href="/" className="text-sm font-medium transition-colors hover:text-primary">
              Home
            </Link>
            <Link href="/dashboard" className="text-sm font-medium transition-colors hover:text-primary">
              Dashboard
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 text-sm font-medium transition-colors hover:text-primary">
                Floor Plan <ChevronDown className="h-3.5 w-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>
                  <Link href="/generator">Floor Plan Generator</Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href="/editor">Floor Plan Editor</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 text-sm font-medium transition-colors hover:text-primary">
                Home Design <ChevronDown className="h-3.5 w-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>Interior Design AI</DropdownMenuItem>
                <DropdownMenuItem>Exterior Design AI</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 text-sm font-medium transition-colors hover:text-primary">
                AI Tools <ChevronDown className="h-3.5 w-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>Virtual Staging AI</DropdownMenuItem>
                <DropdownMenuItem>Sketch to Image AI</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile Menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <nav className="flex flex-col gap-4 mt-8">
                <Link 
                  href="/" 
                  className="text-base font-medium transition-colors hover:text-primary py-2"
                  onClick={() => setIsOpen(false)}
                >
                  Home
                </Link>
                <Link 
                  href="/dashboard" 
                  className="text-base font-medium transition-colors hover:text-primary py-2"
                  onClick={() => setIsOpen(false)}
                >
                  Dashboard
                </Link>
                <div className="flex flex-col gap-2 py-2 border-t border-b border-border">
                  <span className="text-sm font-semibold text-muted-foreground">Floor Plan</span>
                  <Link 
                    href="/generator" 
                    className="text-base font-medium transition-colors hover:text-primary pl-4"
                    onClick={() => setIsOpen(false)}
                  >
                    Floor Plan Generator
                  </Link>
                  <Link 
                    href="/editor" 
                    className="text-base font-medium transition-colors hover:text-primary pl-4"
                    onClick={() => setIsOpen(false)}
                  >
                    Floor Plan Editor
                  </Link>
                </div>
                <div className="flex flex-col gap-2 py-2 border-b border-border">
                  <span className="text-sm font-semibold text-muted-foreground">Home Design</span>
                  <button className="text-base font-medium transition-colors hover:text-primary pl-4 text-left">
                    Interior Design AI
                  </button>
                  <button className="text-base font-medium transition-colors hover:text-primary pl-4 text-left">
                    Exterior Design AI
                  </button>
                </div>
                <div className="flex flex-col gap-2 py-2 border-b border-border">
                  <span className="text-sm font-semibold text-muted-foreground">AI Tools</span>
                  <button className="text-base font-medium transition-colors hover:text-primary pl-4 text-left">
                    Virtual Staging AI
                  </button>
                  <button className="text-base font-medium transition-colors hover:text-primary pl-4 text-left">
                    Sketch to Image AI
                  </button>
                </div>
                <Link 
                  href="/login" 
                  className="mt-4"
                  onClick={() => setIsOpen(false)}
                >
                  <Button className="w-full">Login</Button>
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <Globe className="h-4 w-4" />
                <span className="hidden sm:inline">English</span>
                <ChevronDown className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>English</DropdownMenuItem>
              <DropdownMenuItem>Spanish</DropdownMenuItem>
              <DropdownMenuItem>French</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <ThemeToggle />
          <Link href="/login">
            <Button size="sm" className="ml-2">
              Login
            </Button>
          </Link>
        </div>
      </div>
    </header>
  )
}
