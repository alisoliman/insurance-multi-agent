"use client"

import { useState, useEffect } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { IconPlus, IconEdit, IconTrash, IconRefresh } from "@tabler/icons-react"
import { toast } from "sonner"

interface Task {
  id: string
  title: string
  description?: string
  status: "pending" | "completed"
}

interface TaskCreate {
  title: string
  description?: string
  status: "pending" | "completed"
}

import { getApiUrl } from "@/lib/config"

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [formData, setFormData] = useState<TaskCreate>({
    title: "",
    description: "",
    status: "pending"
  })

  // Fetch tasks from API
  const fetchTasks = async () => {
    setLoading(true)
    try {
      const apiUrl = await getApiUrl()
      const response = await fetch(`${apiUrl}/api/tasks/`)
      if (response.ok) {
        const data = await response.json()
        setTasks(data.tasks || [])
      } else {
        toast.error("Failed to fetch tasks")
      }
    } catch (error) {
      toast.error("Error connecting to API")
      console.error("Error fetching tasks:", error)
    } finally {
      setLoading(false)
    }
  }

  // Create new task
  const createTask = async () => {
    try {
      const apiUrl = await getApiUrl()
      const response = await fetch(`${apiUrl}/api/tasks/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })
      
      if (response.ok) {
        toast.success("Task created successfully")
        setIsCreateDialogOpen(false)
        setFormData({ title: "", description: "", status: "pending" })
        fetchTasks()
      } else {
        toast.error("Failed to create task")
      }
    } catch (error) {
      toast.error("Error creating task")
      console.error("Error creating task:", error)
    }
  }

  // Update task
  const updateTask = async () => {
    if (!editingTask) return
    
    try {
      const apiUrl = await getApiUrl()
      const response = await fetch(`${apiUrl}/api/tasks/${editingTask.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })
      
      if (response.ok) {
        toast.success("Task updated successfully")
        setIsEditDialogOpen(false)
        setEditingTask(null)
        setFormData({ title: "", description: "", status: "pending" })
        fetchTasks()
      } else {
        toast.error("Failed to update task")
      }
    } catch (error) {
      toast.error("Error updating task")
      console.error("Error updating task:", error)
    }
  }

  // Delete task
  const deleteTask = async (taskId: string) => {
    try {
      const apiUrl = await getApiUrl()
      const response = await fetch(`${apiUrl}/api/tasks/${taskId}`, {
        method: "DELETE",
      })
      
      if (response.ok) {
        toast.success("Task deleted successfully")
        fetchTasks()
      } else {
        toast.error("Failed to delete task")
      }
    } catch (error) {
      toast.error("Error deleting task")
      console.error("Error deleting task:", error)
    }
  }

  // Open edit dialog
  const openEditDialog = (task: Task) => {
    setEditingTask(task)
    setFormData({
      title: task.title,
      description: task.description || "",
      status: task.status
    })
    setIsEditDialogOpen(true)
  }

  useEffect(() => {
    fetchTasks()
  }, [])

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h1 className="text-2xl font-bold">Task Management</h1>
                    <p className="text-muted-foreground">
                      Manage your tasks using the FastAPI backend
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={fetchTasks} variant="outline" size="sm">
                      <IconRefresh className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <IconPlus className="h-4 w-4 mr-2" />
                          Add Task
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Create New Task</DialogTitle>
                          <DialogDescription>
                            Add a new task to your list
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                            <Label htmlFor="title">Title</Label>
                            <Input
                              id="title"
                              value={formData.title}
                              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                              placeholder="Enter task title"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                              id="description"
                              value={formData.description}
                              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                              placeholder="Enter task description"
                            />
                          </div>
                          <div className="grid gap-2">
                            <Label htmlFor="status">Status</Label>
                            <Select
                              value={formData.status}
                              onValueChange={(value: "pending" | "completed") => 
                                setFormData({ ...formData, status: value })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button onClick={createTask}>Create Task</Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-muted-foreground">Loading tasks...</div>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {tasks.length === 0 ? (
                      <div className="col-span-full text-center py-8 text-muted-foreground">
                        No tasks found. Create your first task to get started.
                      </div>
                    ) : (
                      tasks.map((task) => (
                        <Card key={task.id}>
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-lg">{task.title}</CardTitle>
                              <Badge variant={task.status === "completed" ? "default" : "secondary"}>
                                {task.status}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            {task.description && (
                              <CardDescription className="mb-4">
                                {task.description}
                              </CardDescription>
                            )}
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEditDialog(task)}
                              >
                                <IconEdit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => deleteTask(task.id)}
                              >
                                <IconTrash className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>
              Update the task details
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter task title"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter task description"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: "pending" | "completed") => 
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={updateTask}>Update Task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  )
} 