'use client';

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home, ArrowLeft, Compass } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="mx-auto max-w-2xl text-center">
        {/* 404 Illustration */}
        <div className="mb-8 flex items-center justify-center">
          <div className="relative">
            <h1 className="text-[150px] font-bold leading-none text-primary md:text-[200px]">
              404
            </h1>
            <div className="absolute inset-0 flex items-center justify-center">
              <Compass className="h-16 w-16 animate-spin text-primary/20 md:h-24 md:w-24" style={{ animationDuration: '3s' }} />
            </div>
          </div>
        </div>

        {/* Error Message */}
        <h2 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl">
          Page Not Found
        </h2>
        <p className="mb-8 text-balance text-lg text-muted-foreground">
          {"Oops! The page you're looking for doesn't exist. It might have been moved or deleted, or you may have entered an incorrect URL."}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/">
            <Button size="lg" className="w-full gap-2 sm:w-auto">
              <Home className="h-4 w-4" />
              Go to Homepage
            </Button>
          </Link>
          <Button
            size="lg"
            variant="outline"
            className="w-full gap-2 sm:w-auto bg-transparent"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
        </div>

        {/* Quick Links */}
        <div className="mt-12 border-t border-border pt-8">
          <p className="mb-4 text-sm font-medium text-muted-foreground">
            Or explore these popular pages:
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/generator">
              <Button variant="ghost" size="sm">
                Floor Plan Generator
              </Button>
            </Link>
            <Link href="/editor">
              <Button variant="ghost" size="sm">
                Floor Plan Editor
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
