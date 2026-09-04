import React, { FC, CSSProperties } from 'react'
import {
  SaveIcon,
  AddIcon,
  ChangeCircleIcon,
  CheckCircleIcon,
} from '@src/shared/utils/icons'
import { useAppContext } from '../AppContext'

const baseStyle: CSSProperties = {
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
  outline: 'none',
}

export const SaveButton: FC = () => {
  const {
    saveButton: {
      clickHandler,
      replaceHandler,
      showSuccessBadge,
      hasExistingAnswers,
    },
  } = useAppContext()

  // Nothing stored yet: a single save button, no ambiguity to resolve.
  if (!hasExistingAnswers) {
    return (
      <button
        type="button"
        onClick={() => clickHandler()}
        title="Save current value as answer."
        style={{ ...baseStyle, color: '#455a64' }}
      >
        <SaveIcon
          style={{ width: '16px', height: '16px', fill: 'currentColor' }}
        />
      </button>
    )
  }

  // Already has answers: saving is now two different intents, so it gets two
  // buttons rather than one that silently picks for you.
  return (
    <>
      <button
        type="button"
        onClick={() => clickHandler()}
        title="Save as an additional answer (keeps the ones already saved)."
        style={{ ...baseStyle, color: '#1976d2' }}
      >
        <SaveIcon
          style={{ width: '16px', height: '16px', fill: 'currentColor' }}
        />
        <AddIcon
          style={{
            position: 'absolute',
            top: '-2px',
            right: '-1px',
            width: '10px',
            height: '10px',
            fill: '#1976d2',
            backgroundColor: '#ffffff',
            borderRadius: '50%',
          }}
        />
        {showSuccessBadge && (
          <CheckCircleIcon
            style={{
              position: 'absolute',
              bottom: '-2px',
              right: '-2px',
              width: '8px',
              height: '8px',
              fill: '#2e7d32',
              backgroundColor: '#ffffff',
              borderRadius: '50%',
            }}
          />
        )}
      </button>
      <button
        type="button"
        onClick={() => replaceHandler()}
        title="Replace all saved answers with the current value."
        style={{ ...baseStyle, color: '#ef6c00', width: '24px' }}
      >
        <ChangeCircleIcon
          style={{ width: '16px', height: '16px', fill: 'currentColor' }}
        />
      </button>
    </>
  )
}
