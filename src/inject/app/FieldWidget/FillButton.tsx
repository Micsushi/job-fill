import React, { FC } from 'react'
import { AutoFixHighIcon, CheckCircleIcon } from '@src/shared/utils/icons'
import { useAppContext } from '../AppContext'

export const FillButton: FC = () => {
  const {
    fillButton: { isFilled, onClick, isDisabled },
  } = useAppContext()

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      title="Autofill"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '28px',
        height: '24px',
        border: 'none',
        background: 'none',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        padding: '0',
        position: 'relative',
        color: isFilled ? '#2e7d32' : '#455a64',
        outline: 'none',
      }}
    >
      <AutoFixHighIcon style={{ width: '16px', height: '16px', fill: 'currentColor' }} />
      {isFilled && (
        <CheckCircleIcon
          style={{
            position: 'absolute',
            top: '-2px',
            right: '-2px',
            width: '10px',
            height: '10px',
            fill: '#2e7d32',
            backgroundColor: '#ffffff',
            borderRadius: '50%',
          }}
        />
      )}
    </button>
  )
}
