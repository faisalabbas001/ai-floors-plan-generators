'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { ChevronDown, Globe, Menu, User, LogOut, Settings, LayoutDashboard, Monitor, FolderOpen, Layers, BookOpen, Shield, FileImage, FileBox } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { useAuthStore } from '@/lib/stores'

export function Navigation() {
  const router = useRouter()
  const { user, isAuthenticated, logout } = useAuthStore()
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogout = () => {
    logout()
    router.push('/')
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 md:h-18 items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center">
            <Image
              src="/Flowplanlogo.png"
              alt="FloorPlan AI Logo"
              width={600}
              height={600}
              className="h-12 sm:h-14 md:h-16 w-auto"
              priority
            />
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
                <DropdownMenuItem>
                  <Link href="/live-design" className="flex items-center gap-2">
                    <Monitor className="h-4 w-4" />
                    Live CAD Design
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Link href="/projects" className="text-sm font-medium transition-colors hover:text-primary">
              Projects
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1 text-sm font-medium transition-colors hover:text-primary">
                Professional <ChevronDown className="h-3.5 w-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem asChild>
                  <Link href="/templates" className="flex items-center gap-2">
                    <Layers className="h-4 w-4" />
                    Templates Library
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/drawings" className="flex items-center gap-2">
                    <FileImage className="h-4 w-4" />
                    Drawings Viewer
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/building-codes" className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Building Codes
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/brand-manual" className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    Brand Manuals
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/revit" className="flex items-center gap-2">
                    <FileBox className="h-4 w-4" />
                    Revit Integration
                  </Link>
                </DropdownMenuItem>
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
                  <Link
                    href="/live-design"
                    className="text-base font-medium transition-colors hover:text-primary pl-4 flex items-center gap-2"
                    onClick={() => setIsOpen(false)}
                  >
                    <Monitor className="h-4 w-4" />
                    Live CAD Design
                  </Link>
                </div>
                <Link
                  href="/projects"
                  className="text-base font-medium transition-colors hover:text-primary py-2"
                  onClick={() => setIsOpen(false)}
                >
                  Projects
                </Link>
                <div className="flex flex-col gap-2 py-2 border-t border-b border-border">
                  <span className="text-sm font-semibold text-muted-foreground">Professional</span>
                  <Link
                    href="/templates"
                    className="text-base font-medium transition-colors hover:text-primary pl-4 flex items-center gap-2"
                    onClick={() => setIsOpen(false)}
                  >
                    <Layers className="h-4 w-4" />
                    Templates Library
                  </Link>
                  <Link
                    href="/drawings"
                    className="text-base font-medium transition-colors hover:text-primary pl-4 flex items-center gap-2"
                    onClick={() => setIsOpen(false)}
                  >
                    <FileImage className="h-4 w-4" />
                    Drawings Viewer
                  </Link>
                  <Link
                    href="/building-codes"
                    className="text-base font-medium transition-colors hover:text-primary pl-4 flex items-center gap-2"
                    onClick={() => setIsOpen(false)}
                  >
                    <Shield className="h-4 w-4" />
                    Building Codes
                  </Link>
                  <Link
                    href="/brand-manual"
                    className="text-base font-medium transition-colors hover:text-primary pl-4 flex items-center gap-2"
                    onClick={() => setIsOpen(false)}
                  >
                    <BookOpen className="h-4 w-4" />
                    Brand Manuals
                  </Link>
                  <Link
                    href="/revit"
                    className="text-base font-medium transition-colors hover:text-primary pl-4 flex items-center gap-2"
                    onClick={() => setIsOpen(false)}
                  >
                    <FileBox className="h-4 w-4" />
                    Revit Integration
                  </Link>
                </div>

                {mounted && isAuthenticated && user ? (
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold">
                        {getInitials(user.name)}
                      </div>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        handleLogout()
                        setIsOpen(false)
                      }}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Log out
                    </Button>
                  </div>
                ) : (
                  <Link href="/login" className="mt-4" onClick={() => setIsOpen(false)}>
                    <Button className="w-full">Login</Button>
                  </Link>
                )}
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

          {/* User Menu or Login Button */}
          {mounted && isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 ml-2">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-semibold">
                    {getInitials(user.name)}
                  </div>
                  <span className="hidden sm:inline max-w-[100px] truncate">{user.name}</span>
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="cursor-pointer">
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    Dashboard
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer">
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600">
                  <LogOut className="w-4 h-4 mr-2" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href="/login">
              <Button size="sm" className="ml-2">
                Login
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
