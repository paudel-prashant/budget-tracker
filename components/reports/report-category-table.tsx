"use client";

import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { formatCurrency, formatPercent } from "@/lib/utils/format";
import type { MonthlyReportCategoryRow } from "@/lib/types";

type ReportCategoryTableProps = {
  title: string;
  subtitle?: string;
  rows: MonthlyReportCategoryRow[];
  emptyMessage?: string;
};

export function ReportCategoryTable({
  title,
  subtitle,
  rows,
  emptyMessage = "No data for this period.",
}: ReportCategoryTableProps) {
  return (
    <Paper variant="outlined" sx={{ overflow: "hidden", height: "100%" }}>
      <Typography variant="h6" sx={{ px: 2.5, pt: 2.5, pb: subtitle ? 0.5 : 1.5 }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="body2" color="text.secondary" sx={{ px: 2.5, pb: 1.5 }}>
          {subtitle}
        </Typography>
      )}
      {rows.length === 0 ? (
        <Typography variant="body2" color="text.secondary" sx={{ px: 2.5, pb: 2.5 }}>
          {emptyMessage}
        </Typography>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Category</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell align="right">Share</TableCell>
                <TableCell align="right">Count</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.category} hover>
                  <TableCell>{row.category}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    {formatCurrency(row.amount)}
                  </TableCell>
                  <TableCell align="right">{formatPercent(row.percentOfTotal)}</TableCell>
                  <TableCell align="right">{row.transactionCount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Paper>
  );
}
