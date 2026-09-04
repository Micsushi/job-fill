import { Fade, Popper } from '@mui/material'
import React, { FC } from 'react'
import { useAppContext } from '../AppContext'
import MoreInfoCardContainer from './MoreInfoCardContainer'

export const MoreInfoPopper: FC = () => {
  const {
    moreInfoPopper: { isOpen, popperRef, anchorEl },
  } = useAppContext()

  return (
    <Popper
      id={isOpen ? 'more-info-popper' : undefined}
      ref={popperRef}
      open={isOpen}
      anchorEl={anchorEl}
      placement="bottom-end"
      transition
      // Keep the panel on screen when the field sits near an edge.
      modifiers={[
        { name: 'offset', options: { offset: [0, 6] } },
        { name: 'preventOverflow', options: { padding: 8 } },
        { name: 'flip', options: { padding: 8 } },
      ]}
      sx={{ zIndex: 2147483001 }}
    >
      {({ TransitionProps }) => (
        <Fade {...TransitionProps} timeout={160}>
          {/* The panel carries its own surface; nothing wraps it. */}
          <div>
            <MoreInfoCardContainer />
          </div>
        </Fade>
      )}
    </Popper>
  )
}
