import styled from '@emotion/styled'
import { Fade } from '@mui/material'
import Badge, { BadgeProps } from '@mui/material/Badge'
import React, { FC } from 'react'
import { CheckCircleIcon } from '@src/shared/utils/icons'

const StyledBadge = styled(Badge)<BadgeProps>(({ theme }) => ({
  '& .MuiBadge-badge': {
    right: 7,
    top: 6.5,
  },
}))

type ButtonSuccessBadgeProps = BadgeProps & {
  show: boolean
}

export const ButtonSuccessBadge: FC<ButtonSuccessBadgeProps> = ({
  show,
  ...props
}) => {
  return (
    <StyledBadge
      badgeContent={
        show ? (
          <Fade in={show}>
            <CheckCircleIcon
              color="success"
              sx={{
                fontSize: '.6rem',
                width: '12px !important',
                height: '12px !important',
                maxWidth: '12px !important',
                maxHeight: '12px !important',
                fill: '#2e7d32 !important',
              }}
            />
          </Fade>
        ) : null
      }
    >
      {props.children}
    </StyledBadge>
  )
}
