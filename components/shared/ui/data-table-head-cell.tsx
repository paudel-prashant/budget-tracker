"use client";

import { TableCell, type TableCellProps } from "@mui/material";
import { tableHeadCellSx } from "@/lib/theme/typography";

/** Consistent column header cell for data tables across the app. */
export function DataTableHeadCell({ sx, ...props }: TableCellProps) {
  return (
    <TableCell
      {...props}
      sx={[tableHeadCellSx, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}
    />
  );
}
