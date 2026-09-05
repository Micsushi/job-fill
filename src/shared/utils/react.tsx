import { createTheme } from "@mui/material";
import { teal } from "@mui/material/colors";
import { cloneElement, ReactElement } from "react";

/**
 * Built in one call on purpose.
 *
 * Merging a palette onto an already-created theme keeps the base theme's
 * derived values: setting only `primary.main` left `primary.dark` as MUI's
 * default blue, so anything using it came out blue on a teal UI. Passing the
 * palette to createTheme directly lets MUI derive light and dark from ours.
 */
export const theme = createTheme({
  typography: {
    allVariants: {
      color: teal[800],
    },
  },
  palette: {
    primary: {
      main: teal[600],
    },
    // teal[50] is near white and unreadable as a control colour.
    secondary: {
      main: teal[800],
    },
  },
})


export type JoinComponents = (componentArray: ReactElement[], joiner: ReactElement) => ReactElement[]

export const joinComponents: JoinComponents = (componentArray, joiner) => {
  return componentArray.reduce<ReactElement[]>((acc, curr, index) => {
    if (index > 0) {
      acc.push(cloneElement(joiner, { key: `separator-${index}` }))
    } 
    acc.push(curr)
    return acc
  }, [])
}