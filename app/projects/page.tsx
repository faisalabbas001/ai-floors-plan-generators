'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Navigation } from '@/components/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Plus,
  Search,
  FolderOpen,
  Clock,
  Loader2,
  Trash2,
  Users,
  GitBranch,
  MoreVertical,
  Building2,
  X,
  RotateCcw,
  Eye,
  UserPlus,
  UserMinus,
  Shield,
  Edit3,
  ArrowLeftRight,
  ChevronRight,
  FileImage,
  History,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuthStore, useProjectsStore, usePlannerStore } from '@/lib/stores'
import { projectsApi } from '@/lib/api'
import { toast } from 'sonner'
import type { Project, ProjectVersion, Collaborator, VersionDiff, CreateProjectData } from '@/lib/api'

// ============================================================
// VERSION HISTORY PANEL
// ============================================================
function VersionHistoryPanel({
  project,
  onClose,
  onRestored,
  onCompare,
}: {
  project: Project
  onClose: () => void
  onRestored: () => void
  onCompare: (v1: number, v2: number) => void
}) {
  const [versions, setVersions] = useState<ProjectVersion[]>([])
  const [loading, setLoading] = useState(true)
  const [restoringVersion, setRestoringVersion] = useState<number | null>(null)
  const [selectedForCompare, setSelectedForCompare] = useState<number | null>(null)

  useEffect(() => {
    loadVersions()
  }, [project.id])

  const loadVersions = async () => {
    setLoading(true)
    try {
      const response = await projectsApi.getProjectVersions(project.id)
      if (response.success && response.data) {
        setVersions(response.data.versions || [])
      }
    } catch {
      toast.error('Failed to load version history')
    } finally {
      setLoading(false)
    }
  }

  const handleRestore = async (versionNumber: number) => {
    if (!confirm(`Restore version ${versionNumber}? This will create a new version with the restored data.`)) return
    setRestoringVersion(versionNumber)
    try {
      const response = await projectsApi.restoreVersion(project.id, versionNumber)
      if (response.success) {
        toast.success(`Version ${versionNumber} restored successfully`)
        onRestored()
        loadVersions()
      } else {
        toast.error(response.message || 'Failed to restore version')
      }
    } catch {
      toast.error('Failed to restore version')
    } finally {
      setRestoringVersion(null)
    }
  }

  const handleCompareClick = (versionNumber: number) => {
    if (selectedForCompare === null) {
      setSelectedForCompare(versionNumber)
      toast.info(`Selected v${versionNumber}. Now click another version to compare.`)
    } else if (selectedForCompare === versionNumber) {
      setSelectedForCompare(null)
    } else {
      onCompare(selectedForCompare, versionNumber)
      setSelectedForCompare(null)
    }
  }

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-md bg-background border-l shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <History className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Version History</h3>
            <p className="text-xs text-muted-foreground">{project.name}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Compare Hint */}
      {selectedForCompare !== null && (
        <div className="px-4 py-2 bg-blue-50 dark:bg-blue-950/30 border-b border-blue-200 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-400 flex items-center gap-2">
          <ArrowLeftRight className="w-3.5 h-3.5" />
          Comparing with v{selectedForCompare} - Click another version to compare
          <Button variant="ghost" size="sm" className="ml-auto h-6 text-xs" onClick={() => setSelectedForCompare(null)}>
            Cancel
          </Button>
        </div>
      )}

      {/* Version List */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center py-16">
              <History className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm font-medium mb-1">No versions yet</p>
              <p className="text-xs text-muted-foreground">
                Versions are created automatically when you update the project.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {versions.map((version, idx) => {
                const isLatest = idx === 0
                const isSelected = selectedForCompare === version.versionNumber
                return (
                  <div
                    key={version.id}
                    className={`relative rounded-lg border p-3 transition-colors ${
                      isSelected
                        ? 'border-blue-400 bg-blue-50/50 dark:bg-blue-950/20'
                        : 'border-border hover:border-primary/30 hover:bg-muted/50'
                    }`}
                  >
                    {/* Timeline connector */}
                    {idx < versions.length - 1 && (
                      <div className="absolute left-[22px] top-[44px] bottom-[-8px] w-px bg-border" />
                    )}

                    <div className="flex items-start gap-3">
                      {/* Timeline dot */}
                      <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ring-2 ring-background ${
                        isLatest ? 'bg-primary' : 'bg-muted-foreground/30'
                      }`} />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm">v{version.versionNumber}</span>
                          {isLatest && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary">
                              CURRENT
                            </span>
                          )}
                        </div>

                        {version.note && (
                          <p className="text-xs text-muted-foreground mb-1.5 line-clamp-2">{version.note}</p>
                        )}

                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground mb-2">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(version.createdAt).toLocaleString()}
                          </span>
                          {version.createdByName && (
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {version.createdByName}
                            </span>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5">
                          {!isLatest && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs gap-1"
                              onClick={() => handleRestore(version.versionNumber)}
                              disabled={restoringVersion === version.versionNumber}
                            >
                              {restoringVersion === version.versionNumber ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <RotateCcw className="w-3 h-3" />
                              )}
                              Restore
                            </Button>
                          )}
                          <Button
                            variant={isSelected ? 'default' : 'outline'}
                            size="sm"
                            className="h-7 text-xs gap-1"
                            onClick={() => handleCompareClick(version.versionNumber)}
                          >
                            <ArrowLeftRight className="w-3 h-3" />
                            {isSelected ? 'Selected' : 'Compare'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 border-t bg-muted/20">
        <p className="text-[11px] text-muted-foreground text-center">
          {versions.length} version{versions.length !== 1 ? 's' : ''} recorded
        </p>
      </div>
    </div>
  )
}

// ============================================================
// COLLABORATOR MANAGEMENT PANEL
// ============================================================
function CollaboratorPanel({
  project,
  onClose,
}: {
  project: Project
  onClose: () => void
}) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [loading, setLoading] = useState(true)
  const [addEmail, setAddEmail] = useState('')
  const [addRole, setAddRole] = useState<'admin' | 'editor' | 'viewer'>('viewer')
  const [adding, setAdding] = useState(false)
  const [removingId, setRemovingId] = useState<number | null>(null)

  useEffect(() => {
    loadCollaborators()
  }, [project.id])

  const loadCollaborators = async () => {
    setLoading(true)
    try {
      const response = await projectsApi.getCollaborators(project.id)
      if (response.success && response.data) {
        setCollaborators(response.data.collaborators || [])
      }
    } catch {
      toast.error('Failed to load collaborators')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = async () => {
    if (!addEmail.trim()) return
    setAdding(true)
    try {
      const response = await projectsApi.addCollaborator(project.id, addEmail.trim(), addRole)
      if (response.success) {
        toast.success(`Invited ${addEmail} as ${addRole}`)
        setAddEmail('')
        setAddRole('viewer')
        loadCollaborators()
      } else {
        toast.error(response.message || 'Failed to add collaborator')
      }
    } catch {
      toast.error('Failed to add collaborator')
    } finally {
      setAdding(false)
    }
  }

  const handleRemove = async (userId: number, name: string) => {
    if (!confirm(`Remove ${name} from this project?`)) return
    setRemovingId(userId)
    try {
      const response = await projectsApi.removeCollaborator(project.id, userId)
      if (response.success) {
        toast.success(`${name} removed from project`)
        setCollaborators(prev => prev.filter(c => c.userId !== userId))
      } else {
        toast.error(response.message || 'Failed to remove collaborator')
      }
    } catch {
      toast.error('Failed to remove collaborator')
    } finally {
      setRemovingId(null)
    }
  }

  const handleUpdateRole = async (userId: number, newRole: 'admin' | 'editor' | 'viewer') => {
    try {
      const response = await projectsApi.updateCollaborator(project.id, userId, { role: newRole })
      if (response.success) {
        setCollaborators(prev => prev.map(c => c.userId === userId ? { ...c, role: newRole } : c))
        toast.success('Role updated')
      } else {
        toast.error(response.message || 'Failed to update role')
      }
    } catch {
      toast.error('Failed to update role')
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="w-3.5 h-3.5 text-amber-500" />
      case 'editor': return <Edit3 className="w-3.5 h-3.5 text-blue-500" />
      default: return <Eye className="w-3.5 h-3.5 text-gray-500" />
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400'
      case 'editor': return 'bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
    }
  }

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-md bg-background border-l shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Team Members</h3>
            <p className="text-xs text-muted-foreground">{project.name}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Add Member */}
      <div className="p-4 border-b bg-muted/10">
        <div className="flex items-center gap-2 mb-3">
          <UserPlus className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Invite Member</span>
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Email address"
            value={addEmail}
            onChange={(e) => setAddEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            className="flex-1 h-9 text-sm"
          />
          <Select value={addRole} onValueChange={(val) => setAddRole(val as 'admin' | 'editor' | 'viewer')}>
            <SelectTrigger className="w-[100px] h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="editor">Editor</SelectItem>
              <SelectItem value="viewer">Viewer</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" className="h-9" onClick={handleAdd} disabled={!addEmail.trim() || adding}>
            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Members List */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : collaborators.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm font-medium mb-1">No team members</p>
              <p className="text-xs text-muted-foreground">
                Invite people to collaborate on this project.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {collaborators.map((collab) => (
                <div
                  key={collab.userId}
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary flex-shrink-0">
                    {collab.name
                      ? collab.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2)
                      : collab.email[0].toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{collab.name || collab.email}</p>
                    <p className="text-xs text-muted-foreground truncate">{collab.email}</p>
                  </div>

                  {/* Role Badge */}
                  <Select
                    value={collab.role}
                    onValueChange={(val) => handleUpdateRole(collab.userId, val as 'admin' | 'editor' | 'viewer')}
                  >
                    <SelectTrigger className={`w-auto h-7 text-[11px] font-medium border-0 gap-1 px-2 ${getRoleBadgeColor(collab.role)}`}>
                      {getRoleIcon(collab.role)}
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="editor">Editor</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Remove */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => handleRemove(collab.userId, collab.name || collab.email)}
                    disabled={removingId === collab.userId}
                  >
                    {removingId === collab.userId ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <UserMinus className="w-3.5 h-3.5" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 border-t bg-muted/20">
        <p className="text-[11px] text-muted-foreground text-center">
          {collaborators.length} member{collaborators.length !== 1 ? 's' : ''} in this project
        </p>
      </div>
    </div>
  )
}

// ============================================================
// VERSION COMPARISON PANEL
// ============================================================
function VersionComparePanel({
  project,
  v1,
  v2,
  onClose,
}: {
  project: Project
  v1: number
  v2: number
  onClose: () => void
}) {
  const [diff, setDiff] = useState<VersionDiff | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDiff()
  }, [project.id, v1, v2])

  const loadDiff = async () => {
    setLoading(true)
    try {
      const response = await projectsApi.compareVersions(project.id, v1, v2)
      if (response.success && response.data) {
        setDiff(response.data)
      } else {
        toast.error(response.message || 'Failed to compare versions')
      }
    } catch {
      toast.error('Failed to compare versions')
    } finally {
      setLoading(false)
    }
  }

  const DiffBadge = ({ type }: { type: 'added' | 'removed' | 'modified' | 'unchanged' }) => {
    const styles = {
      added: 'bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400',
      removed: 'bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400',
      modified: 'bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400',
      unchanged: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    }
    return (
      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${styles[type]}`}>
        {type.toUpperCase()}
      </span>
    )
  }

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-background border-l shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-muted/30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <ArrowLeftRight className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Version Comparison</h3>
            <p className="text-xs text-muted-foreground">
              v{Math.min(v1, v2)} <ArrowRight className="w-3 h-3 inline" /> v{Math.max(v1, v2)}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Diff Content */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : !diff ? (
            <div className="text-center py-16">
              <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm font-medium">Could not load comparison</p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Version Info Header */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg border bg-muted/30">
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Before</span>
                  <p className="font-semibold text-sm mt-1">Version {diff.version1.number}</p>
                  <p className="text-xs text-muted-foreground">{new Date(diff.version1.createdAt).toLocaleDateString()}</p>
                  {diff.version1.note && <p className="text-xs mt-1 text-muted-foreground line-clamp-1">{diff.version1.note}</p>}
                </div>
                <div className="p-3 rounded-lg border bg-primary/5 border-primary/20">
                  <span className="text-[10px] font-medium text-primary uppercase tracking-wider">After</span>
                  <p className="font-semibold text-sm mt-1">Version {diff.version2.number}</p>
                  <p className="text-xs text-muted-foreground">{new Date(diff.version2.createdAt).toLocaleDateString()}</p>
                  {diff.version2.note && <p className="text-xs mt-1 text-muted-foreground line-clamp-1">{diff.version2.note}</p>}
                </div>
              </div>

              <Separator />

              {/* Building Dimensions */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Building Dimensions</h4>
                <div className="p-3 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Dimensions</span>
                    <DiffBadge type={diff.diff.buildingDimensions?.changed ? 'modified' : 'unchanged'} />
                  </div>
                  {diff.diff.buildingDimensions?.changed && (
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 rounded bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400">
                        {JSON.stringify(diff.diff.buildingDimensions.before)}
                      </div>
                      <div className="p-2 rounded bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400">
                        {JSON.stringify(diff.diff.buildingDimensions.after)}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Total Area */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Total Area</h4>
                <div className="p-3 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Area</span>
                    <DiffBadge type={diff.diff.totalArea?.changed ? 'modified' : 'unchanged'} />
                  </div>
                  {diff.diff.totalArea?.changed && (
                    <div className="mt-2 flex items-center gap-2 text-xs">
                      <span className="p-1.5 rounded bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 font-mono">
                        {diff.diff.totalArea.before} sqft
                      </span>
                      <ArrowRight className="w-3 h-3 text-muted-foreground" />
                      <span className="p-1.5 rounded bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 font-mono">
                        {diff.diff.totalArea.after} sqft
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Floors */}
              {diff.diff.floors && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Floors</h4>
                  <div className="space-y-1.5">
                    {diff.diff.floors.added?.map((f) => (
                      <div key={`add-${f}`} className="flex items-center gap-2 p-2 rounded border text-sm">
                        <DiffBadge type="added" />
                        <span>{f}</span>
                      </div>
                    ))}
                    {diff.diff.floors.removed?.map((f) => (
                      <div key={`rem-${f}`} className="flex items-center gap-2 p-2 rounded border text-sm">
                        <DiffBadge type="removed" />
                        <span className="line-through text-muted-foreground">{f}</span>
                      </div>
                    ))}
                    {diff.diff.floors.modified?.map((f) => (
                      <div key={`mod-${f}`} className="flex items-center gap-2 p-2 rounded border text-sm">
                        <DiffBadge type="modified" />
                        <span>{f}</span>
                      </div>
                    ))}
                    {(!diff.diff.floors.added?.length && !diff.diff.floors.removed?.length && !diff.diff.floors.modified?.length) && (
                      <div className="flex items-center gap-2 p-2 rounded border text-sm text-muted-foreground">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        No floor changes
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Rooms */}
              {diff.diff.rooms && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Rooms</h4>
                  <div className="space-y-1.5">
                    {diff.diff.rooms.added?.map((r) => (
                      <div key={`add-${r}`} className="flex items-center gap-2 p-2 rounded border text-sm">
                        <DiffBadge type="added" />
                        <span>{r}</span>
                      </div>
                    ))}
                    {diff.diff.rooms.removed?.map((r) => (
                      <div key={`rem-${r}`} className="flex items-center gap-2 p-2 rounded border text-sm">
                        <DiffBadge type="removed" />
                        <span className="line-through text-muted-foreground">{r}</span>
                      </div>
                    ))}
                    {diff.diff.rooms.modified?.map((r) => (
                      <div key={`mod-${r}`} className="flex items-center gap-2 p-2 rounded border text-sm">
                        <DiffBadge type="modified" />
                        <span>{r}</span>
                      </div>
                    ))}
                    {(!diff.diff.rooms.added?.length && !diff.diff.rooms.removed?.length && !diff.diff.rooms.modified?.length) && (
                      <div className="flex items-center gap-2 p-2 rounded border text-sm text-muted-foreground">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        No room changes
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

// ============================================================
// PROJECT DETAIL VIEW
// ============================================================
function ProjectDetailView({
  project,
  onClose,
  onOpenEditor,
  onViewDrawings,
  onDelete,
  onRefresh,
}: {
  project: Project
  onClose: () => void
  onOpenEditor: (project: Project) => void
  onViewDrawings: (project: Project) => void
  onDelete: (id: number) => void
  onRefresh: () => void
}) {
  const [activePanel, setActivePanel] = useState<'none' | 'versions' | 'collaborators'>('none')
  const [compareVersions, setCompareVersions] = useState<{ v1: number; v2: number } | null>(null)
  const [statusUpdating, setStatusUpdating] = useState(false)
  const { updateProject } = useProjectsStore()

  const hasPlan = project.plan && project.plan.floors && Array.isArray(project.plan.floors) && project.plan.floors.length > 0

  const handleStatusChange = async (newStatus: string) => {
    setStatusUpdating(true)
    const success = await updateProject(project.id, { status: newStatus as Project['status'] })
    if (success) {
      onRefresh()
    }
    setStatusUpdating(false)
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
      in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400',
      review: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-400',
      approved: 'bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400',
      completed: 'bg-purple-100 text-purple-800 dark:bg-purple-950/30 dark:text-purple-400',
    }
    return colors[status] || colors.draft
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 w-full max-w-2xl bg-background border-l shadow-2xl z-40 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold">{project.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground capitalize">{project.buildingType}</span>
                <span className="text-muted-foreground">·</span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${getStatusColor(project.status)}`}>
                  {project.status.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="p-5 space-y-6">
            {/* Quick Actions */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <Button
                variant="outline"
                className="h-auto py-3 flex-col gap-1.5"
                onClick={() => onOpenEditor(project)}
                disabled={!hasPlan}
              >
                <Edit3 className="w-4 h-4" />
                <span className="text-xs">Edit Plan</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-3 flex-col gap-1.5"
                onClick={() => onViewDrawings(project)}
                disabled={!hasPlan}
              >
                <FileImage className="w-4 h-4" />
                <span className="text-xs">Drawings</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-3 flex-col gap-1.5"
                onClick={() => setActivePanel('versions')}
              >
                <History className="w-4 h-4" />
                <span className="text-xs">Versions</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-3 flex-col gap-1.5"
                onClick={() => setActivePanel('collaborators')}
              >
                <Users className="w-4 h-4" />
                <span className="text-xs">Team</span>
              </Button>
            </div>

            {/* Plan Status Card */}
            {hasPlan ? (
              <Card className="border-green-200 dark:border-green-800">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-950/30 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Floor plan attached</p>
                      <p className="text-xs text-muted-foreground">
                        {project.plan.buildingType} · {project.plan.floors.length} floor{project.plan.floors.length > 1 ? 's' : ''} ·{' '}
                        {project.plan.floors.reduce((acc: number, f: { rooms?: unknown[] }) => acc + (f.rooms?.length || 0), 0)} rooms
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-amber-200 dark:border-amber-800">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-950/30 flex items-center justify-center">
                      <AlertCircle className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">No floor plan attached</p>
                      <p className="text-xs text-muted-foreground">Generate a plan to enable drawings and editing.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold">Project Details</h3>

              {project.description && (
                <div>
                  <Label className="text-xs text-muted-foreground">Description</Label>
                  <p className="text-sm mt-1">{project.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <Select
                    value={project.status}
                    onValueChange={handleStatusChange}
                    disabled={statusUpdating}
                  >
                    <SelectTrigger className="mt-1 h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="review">Review</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Building Type</Label>
                  <p className="text-sm mt-2.5 capitalize">{project.buildingType}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Created</Label>
                  <p className="text-sm mt-1">{new Date(project.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Last Updated</Label>
                  <p className="text-sm mt-1">{new Date(project.updatedAt).toLocaleDateString()}</p>
                </div>
              </div>

              {project.clientName && (
                <div>
                  <Label className="text-xs text-muted-foreground">Client</Label>
                  <p className="text-sm mt-1">{project.clientName}</p>
                </div>
              )}

              {project.address && (project.address.street || project.address.city) && (
                <div>
                  <Label className="text-xs text-muted-foreground">Address</Label>
                  <p className="text-sm mt-1">
                    {[project.address.street, project.address.city, project.address.state, project.address.zip]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                </div>
              )}
            </div>

            <Separator />

            {/* Version & Collaboration Summary */}
            <div className="grid grid-cols-2 gap-3">
              <button
                className="p-4 rounded-lg border text-left hover:bg-muted/50 transition-colors"
                onClick={() => setActivePanel('versions')}
              >
                <div className="flex items-center gap-2 mb-2">
                  <GitBranch className="w-4 h-4 text-primary" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Versions</span>
                </div>
                <p className="text-2xl font-bold">{project.versionCount ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-1">View history</p>
              </button>
              <button
                className="p-4 rounded-lg border text-left hover:bg-muted/50 transition-colors"
                onClick={() => setActivePanel('collaborators')}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-primary" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Team</span>
                </div>
                <p className="text-2xl font-bold">{project.collaboratorCount ?? 0}</p>
                <p className="text-xs text-muted-foreground mt-1">Manage team</p>
              </button>
            </div>

            <Separator />

            {/* Danger Zone */}
            <div>
              <h3 className="text-sm font-semibold text-destructive mb-3">Danger Zone</h3>
              <Button
                variant="outline"
                className="border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => {
                  if (confirm(`Delete "${project.name}"? This cannot be undone.`)) {
                    onDelete(project.id)
                    onClose()
                  }
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Project
              </Button>
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Sub-panels */}
      {activePanel === 'versions' && (
        <VersionHistoryPanel
          project={project}
          onClose={() => setActivePanel('none')}
          onRestored={() => {
            onRefresh()
          }}
          onCompare={(v1, v2) => {
            setActivePanel('none')
            setCompareVersions({ v1, v2 })
          }}
        />
      )}

      {activePanel === 'collaborators' && (
        <CollaboratorPanel
          project={project}
          onClose={() => setActivePanel('none')}
        />
      )}

      {compareVersions && (
        <VersionComparePanel
          project={project}
          v1={compareVersions.v1}
          v2={compareVersions.v2}
          onClose={() => setCompareVersions(null)}
        />
      )}
    </>
  )
}

// ============================================================
// MAIN PROJECTS PAGE
// ============================================================
export default function ProjectsPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuthStore()
  const {
    projects,
    sharedProjects,
    isLoading,
    error,
    fetchAllProjects,
    fetchProjects,
    createProject,
    deleteProject,
  } = useProjectsStore()
  const { generatedPlan, setGeneratedPlan } = usePlannerStore()
  const [mounted, setMounted] = useState(false)
  const [loadingProjectId, setLoadingProjectId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [newProject, setNewProject] = useState<CreateProjectData>({
    name: '',
    description: '',
    buildingType: 'residential',
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [mounted, isAuthenticated, authLoading, router])

  useEffect(() => {
    if (mounted && isAuthenticated) {
      fetchAllProjects()
    }
  }, [mounted, isAuthenticated, fetchAllProjects])

  const handleSearch = () => {
    const filters: Record<string, string> = {}
    if (searchQuery) filters.search = searchQuery
    if (statusFilter !== 'all') filters.status = statusFilter
    if (typeFilter !== 'all') filters.buildingType = typeFilter
    fetchAllProjects(filters)
  }

  const handleCreateProject = async () => {
    if (!newProject.name) return
    const projectData: CreateProjectData = { ...newProject }
    if (generatedPlan && generatedPlan.floors && Array.isArray(generatedPlan.floors) && generatedPlan.floors.length > 0) {
      projectData.plan = generatedPlan
    }
    const projectId = await createProject(projectData)
    if (projectId) {
      setShowCreateDialog(false)
      setNewProject({ name: '', description: '', buildingType: 'residential' })
      if (projectData.plan) {
        toast.success('Project created with current floor plan!')
      }
    }
  }

  const handleDeleteProject = async (id: number) => {
    if (confirm('Are you sure you want to delete this project?')) {
      await deleteProject(id)
    }
  }

  const handleOpenInEditor = async (project: Project) => {
    setLoadingProjectId(project.id)
    try {
      const response = await projectsApi.getProjectById(project.id)
      const plan = response.data?.project?.plan
      if (response.success && plan && plan.floors && Array.isArray(plan.floors) && plan.floors.length > 0) {
        setGeneratedPlan(plan)
        toast.success(`Loaded "${project.name}" into editor`)
        router.push('/editor')
      } else {
        toast.error('This project has no floor plan data. Generate a plan first.')
        router.push('/generator')
      }
    } catch {
      toast.error('Failed to load project')
    } finally {
      setLoadingProjectId(null)
    }
  }

  const handleViewDrawings = async (project: Project) => {
    setLoadingProjectId(project.id)
    try {
      const response = await projectsApi.getProjectById(project.id)
      const plan = response.data?.project?.plan
      if (response.success && plan && plan.floors && Array.isArray(plan.floors) && plan.floors.length > 0) {
        setGeneratedPlan(plan)
        toast.success(`Loaded "${project.name}" drawings`)
        router.push('/drawings')
      } else {
        toast.error('This project has no floor plan data. Generate a plan first.')
        router.push('/generator')
      }
    } catch {
      toast.error('Failed to load project')
    } finally {
      setLoadingProjectId(null)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
      in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400',
      review: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-400',
      approved: 'bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400',
      completed: 'bg-purple-100 text-purple-800 dark:bg-purple-950/30 dark:text-purple-400',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getBuildingIcon = (type: string) => {
    return <Building2 className="w-5 h-5 text-primary" />
  }

  // Filtered projects
  const filteredProjects = projects.filter((p: Project) => {
    if (typeFilter !== 'all' && p.buildingType !== typeFilter) return false
    return true
  })

  // Stats
  const stats = {
    total: projects.length,
    withPlans: projects.filter((p: Project) => p.plan && p.plan.floors && Array.isArray(p.plan.floors) && p.plan.floors.length > 0).length,
    inProgress: projects.filter((p: Project) => p.status === 'in_progress').length,
    completed: projects.filter((p: Project) => p.status === 'completed' || p.status === 'approved').length,
  }

  if (!mounted || authLoading) {
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

  if (!isAuthenticated) return null

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-1">Projects</h1>
            <p className="text-muted-foreground text-sm">
              Manage your floor plan projects, versions, and team collaboration.
            </p>
          </div>
          <Button className="gap-2" onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4" /> New Project
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Card className="border-l-4 border-l-primary">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground font-medium">Total Projects</p>
              <p className="text-2xl font-bold mt-1">{stats.total}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground font-medium">With Plans</p>
              <p className="text-2xl font-bold mt-1">{stats.withPlans}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground font-medium">In Progress</p>
              <p className="text-2xl font-bold mt-1">{stats.inProgress}</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-purple-500">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground font-medium">Completed</p>
              <p className="text-2xl font-bold mt-1">{stats.completed}</p>
            </CardContent>
          </Card>
        </div>

        {/* Create Project Dialog */}
        {showCreateDialog && (
          <Card className="mb-6 border-primary shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Create New Project</CardTitle>
              <CardDescription>Start a new architectural project</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Project Name *</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Faysal Bank Branch - Gulshan"
                      value={newProject.name}
                      onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="type">Building Type</Label>
                    <Select
                      value={newProject.buildingType || 'residential'}
                      onValueChange={(val) => setNewProject({ ...newProject, buildingType: val })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="residential">Residential</SelectItem>
                        <SelectItem value="commercial">Commercial</SelectItem>
                        <SelectItem value="bank">Bank Branch</SelectItem>
                        <SelectItem value="hotel">Hotel</SelectItem>
                        <SelectItem value="restaurant">Restaurant</SelectItem>
                        <SelectItem value="office">Office</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of the project..."
                    value={newProject.description || ''}
                    onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                    rows={2}
                  />
                </div>
                {generatedPlan && generatedPlan.floors && generatedPlan.floors.length > 0 && (
                  <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 text-sm text-green-700 dark:text-green-400 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    Your current floor plan ({generatedPlan.buildingType}, {generatedPlan.floors.length} floor{generatedPlan.floors.length > 1 ? 's' : ''}) will be saved with this project.
                  </div>
                )}
                <div className="flex gap-3">
                  <Button onClick={handleCreateProject} disabled={!newProject.name || isLoading}>
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Create Project
                  </Button>
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setTimeout(handleSearch, 0) }}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="review">Review</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={(val) => { setTypeFilter(val) }}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="residential">Residential</SelectItem>
              <SelectItem value="commercial">Commercial</SelectItem>
              <SelectItem value="bank">Bank</SelectItem>
              <SelectItem value="hotel">Hotel</SelectItem>
              <SelectItem value="restaurant">Restaurant</SelectItem>
              <SelectItem value="office">Office</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleSearch}>
            <Search className="w-4 h-4" />
          </Button>
        </div>

        {/* Error State */}
        {error && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20 mb-6">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
            <p className="text-sm text-destructive flex-1">{error}</p>
            <Button variant="outline" size="sm" onClick={() => fetchProjects()}>
              Retry
            </Button>
          </div>
        )}

        {/* Projects Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">Loading projects...</p>
            </div>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <FolderOpen className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Create your first project to start designing floor plans. Projects help you organize, version, and collaborate on architectural designs.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
                <Plus className="w-4 h-4" /> Create Project
              </Button>
              <Button variant="outline" onClick={() => router.push('/generator')} className="gap-2">
                <Building2 className="w-4 h-4" /> Generate Plan First
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map((project: Project) => {
              const hasPlan = project.plan && project.plan.floors && Array.isArray(project.plan.floors) && project.plan.floors.length > 0
              return (
                <Card
                  key={project.id}
                  className="group hover:border-primary/50 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => setSelectedProject(project)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          hasPlan ? 'bg-primary/10' : 'bg-muted'
                        }`}>
                          {getBuildingIcon(project.buildingType)}
                        </div>
                        <div>
                          <CardTitle className="text-base group-hover:text-primary transition-colors">
                            {project.name}
                          </CardTitle>
                          <CardDescription className="text-xs capitalize">
                            {project.buildingType}
                          </CardDescription>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => { e.stopPropagation(); handleOpenInEditor(project) }}
                            disabled={loadingProjectId === project.id || !hasPlan}
                          >
                            <Edit3 className="w-4 h-4 mr-2" />
                            Open in Editor
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => { e.stopPropagation(); handleViewDrawings(project) }}
                            disabled={loadingProjectId === project.id || !hasPlan}
                          >
                            <FileImage className="w-4 h-4 mr-2" />
                            View Drawings
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={(e) => { e.stopPropagation(); handleDeleteProject(project.id) }}
                          >
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {project.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {project.description}
                      </p>
                    )}

                    {/* Plan indicator */}
                    <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs mb-3 ${
                      hasPlan
                        ? 'bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {hasPlan ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {project.plan.floors.length} floor{project.plan.floors.length > 1 ? 's' : ''} ·{' '}
                          {project.plan.floors.reduce((acc: number, f: { rooms?: unknown[] }) => acc + (f.rooms?.length || 0), 0)} rooms
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3.5 h-3.5" />
                          No plan attached
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mb-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                        {project.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(project.updatedAt).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-3">
                        {project.versionCount !== undefined && project.versionCount > 0 && (
                          <div className="flex items-center gap-1" title="Versions">
                            <GitBranch className="w-3 h-3" />
                            {project.versionCount}
                          </div>
                        )}
                        {project.collaboratorCount !== undefined && project.collaboratorCount > 0 && (
                          <div className="flex items-center gap-1" title="Team members">
                            <Users className="w-3 h-3" />
                            {project.collaboratorCount}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Shared Projects Section */}
        {sharedProjects.length > 0 && (
          <div className="mt-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center">
                <Users className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Shared With You</h2>
                <p className="text-xs text-muted-foreground">
                  Projects you&apos;ve been invited to collaborate on
                </p>
              </div>
              <span className="ml-auto px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400">
                {sharedProjects.length} project{sharedProjects.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sharedProjects.map((project: Project) => {
                const hasPlan = project.plan && project.plan.floors && Array.isArray(project.plan.floors) && project.plan.floors.length > 0
                const canEdit = project.role === 'admin' || project.role === 'editor'
                return (
                  <Card
                    key={`shared-${project.id}`}
                    className="group hover:border-blue-400/50 hover:shadow-md transition-all cursor-pointer border-blue-100 dark:border-blue-900/30"
                    onClick={() => setSelectedProject(project)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            hasPlan ? 'bg-blue-50 dark:bg-blue-950/20' : 'bg-muted'
                          }`}>
                            <Building2 className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <CardTitle className="text-base group-hover:text-blue-600 transition-colors">
                              {project.name}
                            </CardTitle>
                            <CardDescription className="text-xs capitalize">
                              {project.buildingType}
                            </CardDescription>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={(e) => { e.stopPropagation(); handleOpenInEditor(project) }}
                              disabled={loadingProjectId === project.id || !hasPlan || !canEdit}
                            >
                              <Edit3 className="w-4 h-4 mr-2" />
                              {canEdit ? 'Open in Editor' : 'View Only'}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => { e.stopPropagation(); handleViewDrawings(project) }}
                              disabled={loadingProjectId === project.id || !hasPlan}
                            >
                              <FileImage className="w-4 h-4 mr-2" />
                              View Drawings
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {/* Owner & Role info */}
                      <div className="flex items-center gap-2 mb-3">
                        {project.owner && (
                          <span className="text-xs text-muted-foreground">
                            by {project.owner.name || project.owner.email}
                          </span>
                        )}
                        <span className="ml-auto">
                          {project.role === 'admin' && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400">
                              <Shield className="w-3 h-3" /> Admin
                            </span>
                          )}
                          {project.role === 'editor' && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400">
                              <Edit3 className="w-3 h-3" /> Editor
                            </span>
                          )}
                          {project.role === 'viewer' && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                              <Eye className="w-3 h-3" /> Viewer
                            </span>
                          )}
                        </span>
                      </div>

                      {/* Plan indicator */}
                      <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs mb-3 ${
                        hasPlan
                          ? 'bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {hasPlan ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {project.plan.floors.length} floor{project.plan.floors.length > 1 ? 's' : ''} ·{' '}
                            {project.plan.floors.reduce((acc: number, f: { rooms?: unknown[] }) => acc + (f.rooms?.length || 0), 0)} rooms
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-3.5 h-3.5" />
                            No plan attached
                          </>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(project.updatedAt).toLocaleDateString()}
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${getStatusColor(project.status)}`}>
                          {project.status.replace('_', ' ')}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}
      </main>

      {/* Project Detail Slide-over */}
      {selectedProject && (
        <ProjectDetailView
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
          onOpenEditor={handleOpenInEditor}
          onViewDrawings={handleViewDrawings}
          onDelete={(id) => {
            handleDeleteProject(id)
            setSelectedProject(null)
          }}
          onRefresh={() => {
            fetchAllProjects()
            // Refresh the selected project data
            projectsApi.getProjectById(selectedProject.id).then((res) => {
              if (res.success && res.data) {
                setSelectedProject(res.data.project)
              }
            })
          }}
        />
      )}
    </div>
  )
}
