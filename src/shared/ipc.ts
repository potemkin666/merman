export const IPC_CHANNELS = {
  CHECK_ENV: 'check-env',
  GET_CONFIG: 'get-config',
  SET_CONFIG: 'set-config',
  RUN_SETUP: 'run-setup',
  START_SERVICE: 'start-service',
  STOP_SERVICE: 'stop-service',
  DISPATCH_TASK: 'dispatch-task',
  GET_LOGS: 'get-logs',
  ON_LOG: 'on-log',
  ON_STATUS_CHANGE: 'on-status-change',
} as const

export type IpcChannel = typeof IPC_CHANNELS[keyof typeof IPC_CHANNELS]
