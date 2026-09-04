/**
 * Attach a field widget without touching the host page's layout.
 *
 * Every in-flow placement we tried disturbed something: a sibling of the
 * field wrapper stole a grid slot and squashed neighbouring inputs, and
 * sitting between the label and the input pushed Workday's radio questions
 * sideways. So the widget is taken out of flow entirely.
 *
 * The anchor should be the element that visually bounds the field -- usually
 * the label's parent, since that is the box the user sees. Anchoring to a
 * wider wrapper puts the widget out in the margin.
 */
export const anchorWidget = (root: HTMLElement, anchor: HTMLElement): void => {
  if (getComputedStyle(anchor).position === 'static') {
    anchor.style.position = 'relative'
  }

  Object.assign(root.style, {
    position: 'absolute',
    top: '0',
    right: '0',
    // Above the page's own chrome, below nothing we care about.
    zIndex: '2147483000',
    display: 'inline-flex',
    alignItems: 'center',
    // Present but understated until the field is in use.
    opacity: '0.75',
    transition: 'opacity 120ms ease-in-out',
  } as Partial<CSSStyleDeclaration>)

  anchor.appendChild(root)

  const emphasise = () => {
    root.style.opacity = '1'
  }
  const relax = () => {
    if (root.contains(document.activeElement)) return
    if (root.getAttribute('data-jaf-pinned') === 'true') return
    root.style.opacity = '0.75'
  }
  anchor.addEventListener('mouseenter', emphasise)
  anchor.addEventListener('focusin', emphasise)
  anchor.addEventListener('mouseleave', relax)
  anchor.addEventListener('focusout', relax)
}

/**
 * The box the user perceives as "the field". Falls back to the field
 * container when there is no label to work from.
 */
export const widgetAnchorFor = (
  labelElement: HTMLElement | null | undefined,
  fallback: HTMLElement
): HTMLElement => {
  return (labelElement?.parentElement as HTMLElement) || fallback
}
