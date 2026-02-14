'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Navigation } from '@/components/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  LayoutGrid,
  Plus,
  FolderOpen,
  Clock,
  Loader2,
  Building2,
  Layers,
  FileImage,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  GitBranch,
  Users,
  Shield,
  Sparkles,
  TrendingUp,
  Monitor,
} from 'lucide-react'
import { useAuthStore, useProjectsStore } from '@/lib/stores'
import type { Project } from '@/lib/api'

export default function DashboardPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading } = useAuthStore()
  const { projects, sharedProjects, isLoading: projectsLoading, fetchAllProjects } = useProjectsStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [mounted, isAuthenticated, isLoading, router])

  useEffect(() => {
    if (mounted && isAuthenticated) {
      fetchAllProjects()
    }
  }, [mounted, isAuthenticated, fetchAllProjects])

  const getTimeAgo = (dateStr: string) => {
    const now = new Date()
    const date = new Date(dateStr)
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
    return date.toLocaleDateString()
  }

  const recentProjects = projects.slice(0, 6)

  const projectsWithPlans = projects.filter(
    (p: Project) => p.plan && p.plan.floors && Array.isArray(p.plan.floors) && p.plan.floors.length > 0
  )

  const stats = {
    totalProjects: projects.length,
    withPlans: projectsWithPlans.length,
    inProgress: projects.filter((p: Project) => p.status === 'in_progress').length,
    completed: projects.filter((p: Project) => p.status === 'completed').length,
    approved: projects.filter((p: Project) => p.status === 'approved').length,
    draft: projects.filter((p: Project) => p.status === 'draft').length,
    totalRooms: projectsWithPlans.reduce((acc: number, p: Project) => {
      return acc + (p.plan?.floors?.reduce((a: number, f: { rooms?: unknown[] }) => a + (f.rooms?.length || 0), 0) || 0)
    }, 0),
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400'
      case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400'
      case 'approved': return 'bg-purple-100 text-purple-800 dark:bg-purple-950/30 dark:text-purple-400'
      case 'review': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
    }
  }

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
        {/* Welcome Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-1">
              Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
            </h1>
            <p className="text-muted-foreground">
              Here&apos;s an overview of your architectural projects and tools.
            </p>
          </div>
          <Link href="/generator">
            <Button className="gap-2">
              <Sparkles className="w-4 h-4" />
              Generate Plan
            </Button>
          </Link>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <Card className="border-l-4 border-l-primary">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Projects</p>
                  <p className="text-3xl font-bold mt-1">{stats.totalProjects}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FolderOpen className="w-5 h-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Plans Generated</p>
                  <p className="text-3xl font-bold mt-1">{stats.withPlans}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-950/30 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">In Progress</p>
                  <p className="text-3xl font-bold mt-1">{stats.inProgress}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Rooms</p>
                  <p className="text-3xl font-bold mt-1">{stats.totalRooms}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-950/30 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <Link href="/generator">
              <Card className="cursor-pointer hover:border-primary transition-all hover:shadow-sm group h-full">
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-sm font-medium">AI Generator</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Create with AI</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/editor">
              <Card className="cursor-pointer hover:border-primary transition-all hover:shadow-sm group h-full">
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                    <LayoutGrid className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-sm font-medium">Editor</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Manual design</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/live-design">
              <Card className="cursor-pointer hover:border-primary transition-all hover:shadow-sm group h-full">
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                    <Monitor className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-sm font-medium">Live CAD</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Real-time design</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/templates">
              <Card className="cursor-pointer hover:border-primary transition-all hover:shadow-sm group h-full">
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                    <Layers className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-sm font-medium">Templates</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Pre-built plans</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/brand-manual">
              <Card className="cursor-pointer hover:border-primary transition-all hover:shadow-sm group h-full">
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                    <BookOpen className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-sm font-medium">Brand Manual</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Design guides</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/building-codes">
              <Card className="cursor-pointer hover:border-primary transition-all hover:shadow-sm group h-full">
                <CardContent className="p-4 flex flex-col items-center text-center">
                  <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                    <Shield className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-sm font-medium">Codes</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Compliance</p>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        {/* Recent Projects */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Projects</h2>
            <Link href="/projects">
              <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>

          {projectsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : recentProjects.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                  <FolderOpen className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="font-semibold mb-1">No projects yet</h3>
                <p className="text-sm text-muted-foreground mb-4">Get started by generating your first floor plan.</p>
                <div className="flex gap-3">
                  <Link href="/generator">
                    <Button className="gap-2">
                      <Sparkles className="w-4 h-4" /> Generate Plan
                    </Button>
                  </Link>
                  <Link href="/projects">
                    <Button variant="outline" className="gap-2">
                      <Plus className="w-4 h-4" /> Create Project
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentProjects.map((project: Project) => {
                const hasPlan = project.plan && project.plan.floors && Array.isArray(project.plan.floors) && project.plan.floors.length > 0
                const roomCount = hasPlan
                  ? project.plan.floors.reduce((acc: number, f: { rooms?: unknown[] }) => acc + (f.rooms?.length || 0), 0)
                  : 0
                return (
                  <Card
                    key={project.id}
                    className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all group"
                    onClick={() => router.push('/projects')}
                  >
                    <CardContent className="p-4">
                      {/* Plan preview or placeholder */}
                      <div className={`aspect-[16/9] rounded-lg mb-3 flex items-center justify-center relative overflow-hidden ${
                        hasPlan ? 'bg-primary/5 border border-primary/10' : 'bg-muted'
                      }`}>
                        {hasPlan ? (
                          <div className="text-center">
                            <Building2 className="w-8 h-8 text-primary/40 mx-auto mb-1" />
                            <p className="text-xs text-primary/60 font-medium">
                              {project.plan.floors.length} floor{project.plan.floors.length > 1 ? 's' : ''} · {roomCount} rooms
                            </p>
                          </div>
                        ) : (
                          <Building2 className="w-10 h-10 text-muted-foreground/40" />
                        )}
                        {/* Status badge overlay */}
                        <span className={`absolute top-2 right-2 text-[10px] px-1.5 py-0.5 rounded font-medium ${getStatusColor(project.status)}`}>
                          {project.status.replace('_', ' ')}
                        </span>
                      </div>

                      <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors truncate">
                        {project.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mb-2 capitalize">{project.buildingType}</p>

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{getTimeAgo(project.updatedAt)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {project.versionCount !== undefined && project.versionCount > 0 && (
                            <span className="flex items-center gap-0.5" title="Versions">
                              <GitBranch className="w-3 h-3" /> {project.versionCount}
                            </span>
                          )}
                          {project.collaboratorCount !== undefined && project.collaboratorCount > 0 && (
                            <span className="flex items-center gap-0.5" title="Team">
                              <Users className="w-3 h-3" /> {project.collaboratorCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>

        {/* Shared Projects */}
        {sharedProjects.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <h2 className="text-lg font-semibold">Shared With You</h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400">
                  {sharedProjects.length}
                </span>
              </div>
              <Link href="/projects">
                <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
                  View All <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sharedProjects.slice(0, 3).map((project: Project) => {
                const hasPlan = project.plan && project.plan.floors && Array.isArray(project.plan.floors) && project.plan.floors.length > 0
                return (
                  <Card
                    key={`shared-${project.id}`}
                    className="cursor-pointer hover:border-blue-400/50 hover:shadow-md transition-all group border-blue-100 dark:border-blue-900/30"
                    onClick={() => router.push('/projects')}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold truncate group-hover:text-blue-600 transition-colors">
                          {project.name}
                        </h3>
                        {project.role && (
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            project.role === 'admin' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400' :
                            project.role === 'editor' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400' :
                            'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                          }`}>
                            {project.role}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-1 capitalize">{project.buildingType}</p>
                      {project.owner && (
                        <p className="text-xs text-muted-foreground">
                          by {project.owner.name || project.owner.email}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {/* Project Status Summary */}
        {projects.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Project Status</h2>
            <Card>
              <CardContent className="p-5">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-2">
                      <span className="text-lg font-bold text-gray-600 dark:text-gray-400">{stats.draft}</span>
                    </div>
                    <p className="text-xs text-muted-foreground font-medium">Draft</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center mx-auto mb-2">
                      <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{stats.inProgress}</span>
                    </div>
                    <p className="text-xs text-muted-foreground font-medium">In Progress</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-950/30 flex items-center justify-center mx-auto mb-2">
                      <span className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                        {projects.filter((p: Project) => p.status === 'review').length}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground font-medium">Review</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-950/30 flex items-center justify-center mx-auto mb-2">
                      <span className="text-lg font-bold text-purple-600 dark:text-purple-400">{stats.approved}</span>
                    </div>
                    <p className="text-xs text-muted-foreground font-medium">Approved</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-950/30 flex items-center justify-center mx-auto mb-2">
                      <span className="text-lg font-bold text-green-600 dark:text-green-400">{stats.completed}</span>
                    </div>
                    <p className="text-xs text-muted-foreground font-medium">Completed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  )
}
