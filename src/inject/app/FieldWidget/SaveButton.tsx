import React, { FC, CSSProperties } from 'react'
import { SaveIcon, ChangeCircleIcon } from '@src/shared/utils/icons'
import { useAppContext } from '../AppContext'

const baseStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '24px',
  height: '22px',
  border: 'none',
  background: 'none',
  cursor: 'pointer',
  padding: '0',
  outline: 'none',
}

const iconStyle: CSSProperties = {
  width: '15px',
  height: '15px',
  fill: 'currentColor',
}

export const SaveButton: FC = () => {
  const {
    saveButton: { clickHandler, replaceHandler, hasExistingAnswers },
  } = useAppContext()

  // Nothing stored yet: one button, no ambiguity to resolve.
  if (!hasExistingAnswers) {
    return (
      <button
        type="button"
        onClick={() => clickHandler()}
        title="Save current value as answer."
        style={{ ...baseStyle, color: '#78909c' }}
      >
        <SaveIcon style={iconStyle} />
      </button>
    )
  }

  // Already has answers, so saving is two different intents and gets two
  // buttons rather than one that silently picks for you. The lit colour is
  // what says "this field has saved answers".
  return (
    <>
      <button
        type="button"
        onClick={() => clickHandler()}
        title="Save as an additional answer (keeps the ones already saved)."
        style={{ ...baseStyle, color: '#1976d2' }}
      >
        <SaveIcon style={iconStyle} />
      </button>
      <button
        type="button"
        onClick={() => replaceHandler()}
        title="Replace all saved answers with the current value."
        style={{ ...baseStyle, color: '#ef6c00' }}
      >
        <ChangeCircleIcon style={iconStyle} />
      </button>
    </>
  )
}
