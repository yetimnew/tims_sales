import * as React from "react"

type ToasterToast = {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  variant?: "default" | "destructive" | "success"
}

const TOAST_LIMIT = 3
const TOAST_REMOVE_DELAY = 1000000

type ToastActionType =
  | {
      type: "ADD_TOAST"
      toast: ToasterToast
    }
  | {
      type: "UPDATE_TOAST"
      toast: Partial<ToasterToast>
    }
  | {
      type: "DISMISS_TOAST"
      toastId?: string
    }
  | {
      type: "REMOVE_TOAST"
      toastId?: string
    }

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

export const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const

let listeners: Array<(state: ToasterToast[]) => void> = []
let memoryState: ToasterToast[] = []
let timeoutIds: Record<string, NodeJS.Timeout> = {}

function dispatch(action: ToastActionType) {
  switch (action.type) {
    case "ADD_TOAST":
      memoryState = [action.toast, ...memoryState].slice(0, TOAST_LIMIT)
      break
    case "DISMISS_TOAST":
      memoryState = memoryState.map((toast) =>
        toast.id === action.toastId ? { ...toast, open: false } : toast
      )
      break
    case "REMOVE_TOAST":
      if (action.toastId) {
        memoryState = memoryState.filter((toast) => toast.id !== action.toastId)
        if (timeoutIds[action.toastId]) {
          clearTimeout(timeoutIds[action.toastId])
          delete timeoutIds[action.toastId]
        }
      }
      break
  }

  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

function toast({ ...props }: ToasterToast) {
  const id = genId()

  const update = (props: ToasterToast) =>
    dispatch({ type: "UPDATE_TOAST", toast: { ...props, id } })
  const dismiss = () => {
    dispatch({ type: "DISMISS_TOAST", toastId: id })
    // Remove after animation (500ms)
    timeoutIds[id] = setTimeout(() => {
      dispatch({ type: "REMOVE_TOAST", toastId: id })
    }, 500)
  }

  const newToast = {
    ...props,
    id,
    open: true,
    onOpenChange: (open: boolean) => {
      if (!open) dismiss()
    },
  }

  memoryState = [newToast, ...memoryState].slice(0, TOAST_LIMIT)

  listeners.forEach((listener) => {
    listener(memoryState)
  })

  // Auto-dismiss after 5 seconds
  timeoutIds[id] = setTimeout(() => {
    dismiss()
  }, 5000)

  return {
    id: id,
    dismiss,
    update,
  }
}

function useToast() {
  const [state, setState] = React.useState<ToasterToast[]>([])

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    toasts: state,
    toast,
    dismiss: (toastId?: string) => {
      if (toastId) {
        timeoutIds[toastId] = setTimeout(() => {
          dispatch({ type: "REMOVE_TOAST", toastId })
        }, 500)
      }
      dispatch({ type: "DISMISS_TOAST", toastId })
    },
  }
}

export { useToast, toast }
