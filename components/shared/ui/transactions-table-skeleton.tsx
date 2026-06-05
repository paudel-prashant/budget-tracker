import {
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { DataTableHeadCell } from "@/components/shared/ui/data-table-head-cell";

const ROWS = 5;

export function TransactionsTableSkeleton() {
  return (
    <TableContainer>
      <Table size="medium">
        <TableHead>
          <TableRow>
            {["Title", "Amount", "Type", "Category", "Date", "Actions"].map((col) => (
              <DataTableHeadCell key={col}>
                {col}
              </DataTableHeadCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {Array.from({ length: ROWS }).map((_, index) => (
            <TableRow key={index}>
              {Array.from({ length: 6 }).map((__, cellIndex) => (
                <TableCell key={cellIndex}>
                  <Skeleton variant="text" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
