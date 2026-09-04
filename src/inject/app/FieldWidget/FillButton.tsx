import React, { FC } from 'react'
import { AutoFixHighIcon } from '@src/shared/utils/icons'
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
      title={isFilled ? 'Field matches a saved answer.' : 'Autofill'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '24px',
        height: '22px',
        border: 'none',
        background: 'none',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        padding: '0',
        // The colour is the state. A separate tick badge said the same thing
        // twice and made the widget wider than it needed to be.
        color: isFilled ? '#2e7d32' : '#78909c',
        outline: 'none',
      }}
    >
      <AutoFixHighIcon
        style={{ width: '15px', height: '15px', fill: 'currentColor' }}
      />
    </button>
  )
}
