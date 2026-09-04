import React, { FC } from 'react'
import { createRoot } from 'react-dom/client'

import { ThemeProvider } from '@mui/material'
import { theme } from '@src/shared/utils/react'
import { ContextProvider } from './AppContext'

import { BaseFormInput } from './services/formFields/baseFormInput'
import { FieldWidgetButtons } from './FieldWidget/FieldWidgetButtons'

import createCache from '@emotion/cache'
import { CacheProvider } from '@emotion/react'

const Main: FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <div
        style={{
        display: 'inline-flex',
        alignItems: 'center',
        margin: '0',
        gap: '2px',
        lineHeight: 1,
        verticalAlign: 'middle',
        }}
      >
        <FieldWidgetButtons />
      </div>
    </ThemeProvider>
  )
}

export const App: React.FC<{
  backend: BaseFormInput<any>
}> = ({ backend }) => {
  return (
    <ContextProvider backend={backend}>
      <Main />
    </ContextProvider>
  )
}

/**
 * Mount a widget with its own emotion cache.
 *
 * The cache container must be the widget root, not `document.head`.
 * Greenhouse's Remix app hydrates the whole `document` inside a
 * `requestIdleCallback`, and React 18 deletes any node in `<head>` that
 * wasn't in the server HTML. A shared cache loses its style tag that way and
 * never re-emits it, because emotion still has every rule marked as inserted.
 * Keeping the styles inside the widget means they're rebuilt whenever the
 * MutationObserver rebuilds the widget.
 */
export const renderWidget = (
  rootElement: HTMLElement,
  app: React.ReactNode
) => {
  // React owns the children of whatever it renders into, so emotion gets its
  // own sibling host rather than sharing the react root.
  const styleHost = document.createElement('div')
  styleHost.style.display = 'none'
  const appHost = document.createElement('div')
  appHost.style.display = 'contents'
  rootElement.append(styleHost, appHost)

  const cache = createCache({ key: 'jaf', container: styleHost })
  createRoot(appHost).render(<CacheProvider value={cache}>{app}</CacheProvider>)
}
