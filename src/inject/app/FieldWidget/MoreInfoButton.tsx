import React, { FC } from 'react'
import { MoreInfoPopper } from '../MoreInfoPopup/MoreInfoPopper'
import { CloseIcon, MoreVertIcon } from '@src/shared/utils/icons'
import { useAppContext } from '../AppContext'
import { Button } from '@mui/material'

export const MoreInfoButton: FC = () => {
  const {
    moreInfoPopper: { isOpen, handleToggleButtonClick },
  } = useAppContext()
  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      <button
        type="button"
        onClick={handleToggleButtonClick}
        title="More options"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '28px',
          height: '24px',
          border: 'none',
          background: isOpen ? '#e0f2f1' : 'none',
          borderRadius: '0 5px 5px 0',
          cursor: 'pointer',
          padding: '0',
          color: '#455a64',
          outline: 'none',
        }}
      >
        {isOpen ? (
          <CloseIcon style={{ width: '16px', height: '16px', fill: 'currentColor' }} />
        ) : (
          <MoreVertIcon style={{ width: '16px', height: '16px', fill: 'currentColor' }} />
        )}
      </button>
      <MoreInfoPopper />
    </div>
  )
}
