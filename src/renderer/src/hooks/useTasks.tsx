import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { useIpc } from './useIpc'
import { IPC_CHANNELS } from '../../../shared/ipc'
import type { TaskResult } from '../../../shared/types'

interface TasksContextValue {
  recentTasks: TaskResult[]
  addTask: (task: TaskResult) => void
}

const TasksContext = createContext<TasksContextValue | null>(null)

export const TasksProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { invoke } = useIpc()
  const [recentTasks, setRecentTasks] = useState<TaskResult[]>([])

  useEffect(() => {
    invoke<TaskResult[]>(IPC_CHANNELS.GET_TASKS)
      .then(setRecentTasks)
      .catch((e) => console.error('Tasks load error:', e))
  }, [invoke])

  const addTask = useCallback((task: TaskResult) => {
    setRecentTasks((prev) => [task, ...prev].slice(0, 20))
    invoke(IPC_CHANNELS.ADD_TASK, task).catch((e) =>
      console.error('Task persist error:', e)
    )
  }, [invoke])

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
