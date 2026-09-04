import { Box, Fade, Paper, Popper } from '@mui/material'
import React, { FC } from 'react'
import { useAppContext } from '../AppContext'
import MoreInfoCardContainer from './MoreInfoCardContainer'

export const MoreInfoPopper: FC = () => {
  const {
    moreInfoPopper: { isOpen, popperRef, anchorEl },
  } = useAppContext()

  return (
    <Popper
      id={isOpen ? `more-info-popper` : undefined}
      ref={popperRef}
      open={isOpen}
      anchorEl={anchorEl}
      placement="bottom-start"
      transition
      sx={{ zIndex: 999999 }}
    >
      {({ TransitionProps }) => (
        <Fade {...TransitionProps} timeout={350}>
          <Box mx={1}>
            <Paper elevation={8}>
              <Box mt={2}>
                <MoreInfoCardContainer />
              </Box>
            </Paper>
          </Box>
        </Fade>
      )}
    </Popper>
  )
}
