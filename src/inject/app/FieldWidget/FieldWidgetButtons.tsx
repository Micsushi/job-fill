import React, { FC, useEffect } from 'react'
import { ButtonGroup, Paper } from '@mui/material'
import { useAppContext } from '../AppContext'
import { FillButton } from './FillButton'
import { SaveButton } from './SaveButton'
import { MoreInfoButton } from './MoreInfoButton'

export const FieldWidgetButtons: FC = () => {
  const { moreInfoPopper } = useAppContext()

  // The widget dims when the pointer leaves the field. Keep it at full
  // strength while its own popup is open.
  useEffect(() => {
    const widget = (
      moreInfoPopper.anchorRef as React.MutableRefObject<HTMLElement | null>
    ).current?.closest('.jaf-widget') as HTMLElement | null
    if (!widget) return
    widget.setAttribute('data-jaf-pinned', String(moreInfoPopper.isOpen))
    if (moreInfoPopper.isOpen) {
      widget.style.opacity = '1'
    }
  }, [moreInfoPopper.isOpen])

  return (
    <div
      ref={moreInfoPopper.anchorRef as any}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        border: '1px solid #cfd8dc',
        borderRadius: '6px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)',
        height: '26px',
        position: 'relative',
        userSelect: 'none',
      }}
    >
      <FillButton />
      <div style={{ width: '1px', height: '16px', backgroundColor: '#e0e0e0', flexShrink: 0 }} />
      <SaveButton />
      <div style={{ width: '1px', height: '16px', backgroundColor: '#e0e0e0', flexShrink: 0 }} />
      <MoreInfoButton />
    </div>
  )
}
