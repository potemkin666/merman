import React, { useState } from 'react'
import { BottleCard } from './BottleCard'
import { Modal } from './Modal'
import { useConfig } from '../hooks/useConfig'
import type { TaskResult } from '../../../shared/types'

interface BottleGridProps {
  tasks: TaskResult[]
}

export const BottleGrid: React.FC<BottleGridProps> = ({ tasks }) => {
  const { config } = useConfig()
  const name = config.emissaryName || 'Azurel'
  const [selectedTask, setSelectedTask] = useState<TaskResult | null>(null)

  return (
    <>
      <div
        role="list"
        aria-label="Past dispatches — message bottles"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 12,
          padding: '16px 0',
        }}
      >
        {tasks.slice(0, 12).map((task) => (
          <div key={task.id} role="listitem">
            <BottleCard task={task} onClick={() => setSelectedTask(task)} />
          </div>
        ))}
      </div>

      {/* Uncork modal */}
      <Modal
        open={!!selectedTask}
        title={selectedTask?.status === 'error' ? '💔 Cracked Bottle' : '🍾 Uncorked Message'}
        onClose={() => setSelectedTask(null)}
      >
        {selectedTask && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 4 }}>
                Dispatched at {new Date(selectedTask.startedAt).toLocaleString()}
                {selectedTask.finishedAt && ` • Returned at ${new Date(selectedTask.finishedAt).toLocaleTimeString()}`}
              </p>
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 8 }}>
                Mode: <strong style={{ color: 'var(--color-primary)' }}>{selectedTask.mode}</strong>
              </p>
            </div>

            <div
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: 16,
                marginBottom: 16,
              }}
            >
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 6, fontWeight: 600 }}>
                📜 Original instruction:
              </p>
              <p style={{ fontSize: 13, color: 'var(--color-text)', lineHeight: 1.6 }}>
                {selectedTask.prompt}
              </p>
            </div>

            {selectedTask.status === 'done' && selectedTask.output && (
              <div
                style={{
                  background: 'rgba(45,212,160,0.06)',
                  border: '1px solid rgba(45,212,160,0.2)',
                  borderRadius: 'var(--radius-md)',
                  padding: 16,
                }}
              >
                <p style={{ fontSize: 12, color: 'var(--color-success)', marginBottom: 6, fontWeight: 600 }}>
                  ✅ Result:
                </p>
                <pre
                  style={{
                    fontSize: 12,
                    fontFamily: 'monospace',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                    color: 'var(--color-text)',
                    maxHeight: 200,
                    overflowY: 'auto',
                  }}
                >
                  {selectedTask.output}
                </pre>
              </div>
            )}

            {selectedTask.status === 'done' && !selectedTask.output && (
              <p style={{ fontSize: 13, color: 'var(--color-success)' }}>
                ✅ Task completed successfully (no text output returned).
              </p>
            )}

            {selectedTask.status === 'error' && (
              <div
                style={{
                  background: 'rgba(232,93,93,0.06)',
                  border: '1px solid rgba(232,93,93,0.2)',
                  borderRadius: 'var(--radius-md)',
                  padding: 16,
                }}
              >
                <p style={{ fontSize: 12, color: 'var(--color-error)', marginBottom: 6, fontWeight: 600 }}>
                  ❌ {name} returned empty-handed
                </p>
                <p style={{ fontSize: 13, color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                  This task encountered an error. Check the Tide Log for details about what went wrong.
                </p>
              </div>
            )}

            {selectedTask.status === 'running' && (
              <p style={{ fontSize: 13, color: 'var(--color-primary)' }}>
                🌊 {name} is still working on this task...
              </p>
            )}
          </div>
        )}
      </Modal>
    </>
  )
}
