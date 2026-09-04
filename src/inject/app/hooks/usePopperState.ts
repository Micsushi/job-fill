import {
  MutableRefObject,
  Dispatch,
  SetStateAction,
  MouseEvent,
  useRef,
  useState,
  useEffect,
} from 'react'
import { AppContextType } from '../AppContext'


export type PopperState = {
  anchorRef: MutableRefObject<any>
  popperRef: MutableRefObject<any>
  anchorEl: HTMLElement
  setAnchorEl: Dispatch<SetStateAction<HTMLElement>>
  isOpen: boolean
  close: () => void
  open: () => void
  handleToggleButtonClick: (e: MouseEvent<HTMLElement>) => void
  handleRefreshButtonClick: () => Promise<void>
  isRefreshing: boolean
  fieldType: string
}

function isInRect(
  x: number,
  y: number,
  rects: DOMRect[],
  margin: number = 0
): boolean {
  return rects.some((rect) => {
    return (
      rect &&
      x >= rect.left - margin &&
      x <= rect.right + margin &&
      y >= rect.top - margin &&
      y <= rect.bottom + margin
    )
  })
}

const handleEscape = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    e.preventDefault()
    close()
    document.removeEventListener('keyup', handleEscape)
  }
}

export const usePopperState = ({init, backend}: Pick<AppContextType, "init" | "backend">): PopperState => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const anchorRef = useRef<HTMLElement | null>(null)
  const popperRef = useRef<HTMLElement | null>(null)
  const isOpen = Boolean(anchorEl)
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)
  
  const handleRefreshButtonClick = async () => {
    setIsRefreshing(true)
    await init()
    setIsRefreshing(false)
  }

  const open = () => {
    setAnchorEl(anchorRef.current)
  }

  const close = () => {
    setAnchorEl(null)
  }

  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      close()
    }
  }

  const handleClickAway = (e: PointerEvent) => {
    const { x, y } = e
    const popperEl = popperRef.current
    const anchor = anchorRef.current
    const target = e.target as Node
    const path = typeof e.composedPath === 'function' ? e.composedPath() : []

    const isInsidePopper = Boolean(
      popperEl && (popperEl.contains(target) || isInRect(x, y, [popperEl.getBoundingClientRect()], 5))
    )
    const isInsideAnchor = Boolean(
      anchor && (anchor.contains(target) || isInRect(x, y, [anchor.getBoundingClientRect()], 5))
    )
    const isInFormField = backend.clickIsInFormfield(e)
    const isInModal = path.some((el: any) => el?.classList?.contains?.('MuiModal-root'))

    if (isInsidePopper || isInsideAnchor || isInFormField || isInModal) {
      return
    }
    close()
  }

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keyup', handleEscape)
      // Use setTimeout to avoid firing on the same click that opened the popper
      const timer = setTimeout(() => {
        document.addEventListener('click', handleClickAway)
      }, 0)
      return () => {
        clearTimeout(timer)
        document.removeEventListener('keyup', handleEscape)
        document.removeEventListener('click', handleClickAway)
      }
    }
  }, [isOpen])

  const handleToggleButtonClick = (e: MouseEvent<HTMLElement>) => {
    e.stopPropagation()
    if (!isOpen) {
      open()
    } else {
      close()
    }
  }

  return {
    anchorEl,
    popperRef,
    setAnchorEl,
    anchorRef,
    isOpen,
    open,
    close,
    handleToggleButtonClick,
    handleRefreshButtonClick,
    isRefreshing,
    fieldType: backend.fieldType
  }
}
