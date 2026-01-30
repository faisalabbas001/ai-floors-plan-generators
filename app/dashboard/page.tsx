'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Navigation } from '@/components/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LayoutGrid, Plus, FolderOpen, Clock, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/lib/stores'

export default function DashboardPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useAuthStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [mounted, isAuthenticated, isLoading, router])

  const recentProjects = [
    {
      id: 1,
      name: 'Modern House Layout',
      type: '3 Bedroom Residential',
      lastModified: '2 hours ago',
      thumbnail: '/placeholder-floor-plan.png',
    },
    {
      id: 2,
      name: 'Office Space Design',
      type: 'Commercial Building',
      lastModified: '1 day ago',
      thumbnail: '/placeholder-floor-plan.png',
    },
    {
      id: 3,
      name: 'Restaurant Floor Plan',
      type: 'Commercial - Restaurant',
      lastModified: '3 days ago',
      thumbnail: '/placeholder-floor-plan.png',
    },
  ]

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </main>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}!
          </h1>
          <p className="text-muted-foreground">Continue your design work or start a new project.</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link href="/generator">
            <Card className="cursor-pointer hover:border-primary transition-colors group">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2 group-hover:bg-primary/20 transition-colors">
                  <LayoutGrid className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Generate Floor Plan</CardTitle>
                <CardDescription>Create a new floor plan with AI</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/editor">
            <Card className="cursor-pointer hover:border-primary transition-colors group">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2 group-hover:bg-primary/20 transition-colors">
                  <Plus className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Blank Canvas</CardTitle>
                <CardDescription>Start drawing from scratch</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Card className="cursor-pointer hover:border-primary transition-colors group">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-2 group-hover:bg-primary/20 transition-colors">
                <FolderOpen className="w-6 h-6 text-primary" />
              </div>
              <CardTitle>Browse Templates</CardTitle>
              <CardDescription>Use pre-made floor plans</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Recent Projects */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">Recent Projects</h2>
            <Button variant="ghost">View All</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentProjects.map((project) => (
              <Card key={project.id} className="cursor-pointer hover:border-primary transition-colors group">
                <CardContent className="p-4">
                  <div className="aspect-video bg-muted rounded-lg mb-3 flex items-center justify-center">
                    <LayoutGrid className="w-12 h-12 text-muted-foreground" />
                  </div>
                  <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">{project.name}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{project.type}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>{project.lastModified}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Total Projects</CardDescription>
              <CardTitle className="text-3xl">12</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Plans Generated</CardDescription>
              <CardTitle className="text-3xl">28</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Hours Saved</CardDescription>
              <CardTitle className="text-3xl">45</CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardDescription>AI Credits</CardDescription>
              <CardTitle className="text-3xl">150</CardTitle>
            </CardHeader>
          </Card>
        </div>
      </main>
    </div>
  )
}
