import React, { useState, FC, useRef, useEffect, ReactNode } from 'react';
import { Box, Link } from '@mui/material';
import { ConditionalTooltip } from './ConditionalTooltip';

/**
 * Full featured expandable text...
 * If text is truncated, has a tooltip and expands on click.
 * @param param0
 * @returns
 */
export const ExpandableText: FC<{ children: ReactNode; maxLines?: number }> = ({
  children,
  maxLines = 1,
}) => {
  const [expanded, setExpanded] = useState(false);
  const textRef = useRef<HTMLElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    const element = textRef.current;
    if (element) {
      // Check if the content is overflowing
      setIsTruncated(element.scrollHeight > element.clientHeight);
    }
  }, [children]);

  const CollapseButton = expanded && (
    <Link
      component="span"
      variant="body1"
      sx={{ ml: 1 }}
      onClick={() => setExpanded(false)}
    >
      Collapse
    </Link>
  );

  const expandable = isTruncated && !expanded;

  return (
    <span>
      <ConditionalTooltip showIf={expandable} title="Click to expand.">
        <Box
          component="span"
          ref={textRef}
          sx={{
            display: '-webkit-box',
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            WebkitLineClamp: expanded ? 'unset' : maxLines,
          }}
          onClick={() => expandable && setExpanded(true)}
        >
          {children}
          {CollapseButton}
        </Box>
      </ConditionalTooltip>
    </span>
  );
};
