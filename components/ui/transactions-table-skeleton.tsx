import {
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";

const ROWS = 5;

export function TransactionsTableSkeleton() {
  return (
    <TableContainer>
      <Table size="medium">
        <TableHead>
          <TableRow>
            {["Title", "Amount", "Type", "Category", "Date", "Actions"].map((col) => (
              <TableCell key={col}>
                <Skeleton variant="text" width={col === "Actions" ? 40 : 80} />
              </TableCell>
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
