import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import type { TaskResult } from '../../../shared/types'

interface TasksContextValue {
  recentTasks: TaskResult[]
  addTask: (task: TaskResult) => void
}

const TasksContext = createContext<TasksContextValue | null>(null)

export const TasksProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [recentTasks, setRecentTasks] = useState<TaskResult[]>([])

  useEffect(() => {
    const stored = localStorage.getItem('recentTasks')
    if (stored) {
      try {
        setRecentTasks(JSON.parse(stored))
      } catch {
        // ignore corrupt data
      }
    }
  }, [])

  const addTask = useCallback((task: TaskResult) => {
    setRecentTasks((prev) => {
      const updated = [task, ...prev].slice(0, 20)
      localStorage.setItem('recentTasks', JSON.stringify(updated))
      return updated
    })
  }, [])

  return (
    <TasksContext.Provider value={{ recentTasks, addTask }}>
      {children}
    </TasksContext.Provider>
  )
}

export function useTasks(): TasksContextValue {
  const ctx = useContext(TasksContext)
  if (!ctx) throw new Error('useTasks must be used within a TasksProvider')
  return ctx
}
