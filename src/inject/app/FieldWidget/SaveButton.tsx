import React, { FC } from 'react'
import { SaveIcon, CheckCircleIcon } from '@src/shared/utils/icons'
import { useAppContext } from '../AppContext'

export const SaveButton: FC = () => {
  const {
    saveButton: { clickHandler, showSuccessBadge },
  } = useAppContext()

  return (
    <button
      type="button"
      onClick={() => clickHandler()}
      title="Save current value as answer."
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '28px',
        height: '24px',
        border: 'none',
        background: 'none',
        cursor: 'pointer',
        padding: '0',
        position: 'relative',
        color: showSuccessBadge ? '#1976d2' : '#455a64',
        outline: 'none',
      }}
    >
      <SaveIcon style={{ width: '16px', height: '16px', fill: 'currentColor' }} />
      {showSuccessBadge && (
        <CheckCircleIcon
          style={{
            position: 'absolute',
            top: '-2px',
            right: '-2px',
            width: '10px',
            height: '10px',
            fill: '#1976d2',
            backgroundColor: '#ffffff',
            borderRadius: '50%',
          }}
        />
      )}
    </button>
  )
}
