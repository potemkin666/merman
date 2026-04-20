import type { ErrorExplanation } from '../../shared/types'

export function translateError(message: string, context: 'setup' | 'start' | 'dispatch'): ErrorExplanation {
  const lower = message.toLowerCase()

  if (lower.includes('enoent') || lower.includes('not found') || lower.includes('no such file')) {
    return {
      what: 'A required file or directory was not found.',
      cause: 'The configured path may be incorrect, or dependencies are missing.',
      action: 'Check your OpenClaw path in Deep Config, then re-run Setup.',
      retryable: true,
    }
  }
  if (lower.includes('eacces') || lower.includes('permission denied')) {
    return {
      what: 'Permission was denied when accessing a file or directory.',
      cause: 'The app does not have the right permissions for that folder.',
      action: 'Check folder permissions, or try choosing a different directory.',
      retryable: true,
    }
  }
  if (lower.includes('eaddrinuse') || lower.includes('address already in use')) {
    return {
      what: 'The port is already in use.',
      cause: 'Another service (or a previous instance) is using the same port.',
      action: 'Stop the other process or change the port in your OpenClaw config.',
      retryable: true,
    }
  }
  if (lower.includes('npm err') || lower.includes('npm warn') || lower.includes('exit code 1')) {
    return {
      what: context === 'setup' ? 'Dependency installation failed.' : 'The process exited with an error.',
      cause: 'A package may have failed to install, or a script error occurred.',
      action: 'Check the Tide Log for details. You can also try running the command manually in a terminal.',
      retryable: true,
    }
  }
  if (lower.includes('timeout') || lower.includes('timed out')) {
    return {
      what: 'The operation timed out.',
      cause: 'A network request or process took too long to respond.',
      action: 'Check your internet connection and try again.',
      retryable: true,
    }
  }
  return {
    what: 'An unexpected error occurred.',
    cause: message,
    action: 'Review the Tide Log for more details. If the problem persists, check the OpenClaw documentation.',
    retryable: true,
  }
}
