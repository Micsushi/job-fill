import { styled, TableCell } from "@mui/material";

export const TH = styled(TableCell)(() => ({
  fontSize: '1rem',
  fontWeight: 600,
  padding: 6,
}));

export const TD = styled(TableCell)(() => ({
  verticalAlign: 'top',
  padding: 6,
}));

