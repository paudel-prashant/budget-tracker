"use client";

import { useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs, { type Dayjs } from "dayjs";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";
import { dialogDatePickerSlotProps } from "@/lib/theme/date-picker";
import { formFieldSx, formTextFieldProps } from "@/lib/theme/form-field";
import { CARD_PADDING, FORM_STACK_SPACING } from "@/lib/config/layout-constants";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { useSnackbar } from "@/components/shared/providers/snackbar-provider";
import type { ImportPreviewResponse } from "@/lib/types";

const datePickerFieldProps = { ...formTextFieldProps };

const STATUS_COLORS = {
  valid: "success",
  invalid: "error",
  duplicate: "warning",
} as const;

export function ImportExportSection() {
  const { showSuccess, showError, showInfo } = useSnackbar();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const [exportStart, setExportStart] = useState<Dayjs | null>(null);
  const [exportEnd, setExportEnd] = useState<Dayjs | null>(null);
  const [exporting, setExporting] = useState(false);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<ImportPreviewResponse | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const handleExport = async () => {
    if (exportStart && exportEnd && exportStart.isAfter(exportEnd)) {
      showError("Start date cannot be after end date");
      return;
    }

    setExporting(true);

    try {
      const params = new URLSearchParams();

      if (exportStart) {
        params.set("startDate", exportStart.startOf("day").toISOString());
      }
      if (exportEnd) {
        params.set("endDate", exportEnd.startOf("day").toISOString());
      }

      const query = params.toString();
      const response = await fetch(
        `/api/transactions/export${query ? `?${query}` : ""}`
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? "Export failed");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `transactions-${dayjs().format("YYYY-MM-DD")}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);

      showSuccess("Transactions exported successfully");
      setExportOpen(false);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  const resetImportState = () => {
    setSelectedFile(null);
    setPreview(null);
    setImportError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    setPreview(null);
    setImportError(null);
  };

  const handlePreview = async () => {
    if (!selectedFile) {
      setImportError("Select a CSV file first");
      return;
    }

    setPreviewing(true);
    setImportError(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("/api/transactions/import/preview", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to parse CSV");
      }

      setPreview(data as ImportPreviewResponse);
      setImportOpen(false);
      setPreviewOpen(true);

      if (data.summary.valid === 0) {
        showInfo("No valid rows ready to import. Review errors in the preview.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to parse CSV";
      setImportError(message);
      showError(message);
    } finally {
      setPreviewing(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!preview) return;

    const rowsToImport = preview.rows
      .filter((row) => row.status === "valid" && row.data)
      .map((row) => row.data!);

    if (rowsToImport.length === 0) {
      showError("No valid rows to import");
      return;
    }

    setImporting(true);

    try {
      const response = await fetch("/api/transactions/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: rowsToImport }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Import failed");
      }

      showSuccess(
        `Imported ${data.imported} transaction${data.imported === 1 ? "" : "s"}${
          data.skipped > 0 ? ` (${data.skipped} skipped as duplicates)` : ""
        }`
      );

      setPreviewOpen(false);
      resetImportState();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setImporting(false);
    }
  };

  return (
    <>
      <Stack sx={{ p: CARD_PADDING }} spacing={2.5}>
        <Box>
          <Typography variant="subtitle1" fontWeight={600}>
            Import / Export
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Back up transactions as CSV or bulk-import from a spreadsheet. Required columns:
            title, amount, type, category, date.
          </Typography>
        </Box>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
          <Button
            variant="outlined"
            startIcon={<FileDownloadOutlinedIcon />}
            onClick={() => setExportOpen(true)}
          >
            Export CSV
          </Button>
          <Button
            variant="contained"
            startIcon={<FileUploadOutlinedIcon />}
            onClick={() => {
              resetImportState();
              setImportOpen(true);
            }}
          >
            Import CSV
          </Button>
        </Stack>
      </Stack>

      <Dialog
        open={exportOpen}
        onClose={() => !exporting && setExportOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Export Transactions</DialogTitle>
        <DialogContent dividers>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Stack spacing={FORM_STACK_SPACING} sx={{ py: 1 }}>
              <Alert severity="info" variant="outlined">
                Leave dates empty to export all transactions. Otherwise only transactions within
                the range are included.
              </Alert>
              <Box sx={formFieldSx}>
                <DatePicker
                  label="Start date (optional)"
                  value={exportStart}
                  onChange={setExportStart}
                  slotProps={dialogDatePickerSlotProps(datePickerFieldProps)}
                />
              </Box>
              <Box sx={formFieldSx}>
                <DatePicker
                  label="End date (optional)"
                  value={exportEnd}
                  onChange={setExportEnd}
                  minDate={exportStart ?? undefined}
                  slotProps={dialogDatePickerSlotProps(datePickerFieldProps)}
                />
              </Box>
            </Stack>
          </LocalizationProvider>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setExportOpen(false)} disabled={exporting}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleExport} disabled={exporting}>
            {exporting ? "Exporting..." : "Download CSV"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={importOpen}
        onClose={() => !previewing && setImportOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Import Transactions</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ py: 1 }}>
            {importError && <Alert severity="error">{importError}</Alert>}
            <Alert severity="info" variant="outlined">
              Upload a CSV with columns: title, amount, type (INCOME/EXPENSE), category, date
              (YYYY-MM-DD). You will preview rows before anything is saved.
            </Alert>
            <Button variant="outlined" component="label">
              {selectedFile ? selectedFile.name : "Choose CSV file"}
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                hidden
                onChange={handleFileChange}
              />
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setImportOpen(false)} disabled={previewing}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handlePreview}
            disabled={!selectedFile || previewing}
          >
            {previewing ? "Parsing..." : "Preview Import"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={previewOpen}
        onClose={() => !importing && setPreviewOpen(false)}
        fullWidth
        maxWidth="lg"
        scroll="paper"
        sx={{ "& .MuiDialog-paper": { m: { xs: 2, sm: 3 }, maxHeight: "calc(100dvh - 32px)" } }}
      >
        <DialogTitle>Import Preview</DialogTitle>
        <DialogContent dividers sx={{ px: { xs: 2, sm: 3 } }}>
          {preview && (
            <Stack spacing={2}>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip label={`${preview.summary.total} rows`} size="small" />
                <Chip
                  label={`${preview.summary.valid} valid`}
                  color="success"
                  size="small"
                  variant="outlined"
                />
                <Chip
                  label={`${preview.summary.invalid} invalid`}
                  color="error"
                  size="small"
                  variant="outlined"
                />
                <Chip
                  label={`${preview.summary.duplicate} duplicates`}
                  color="warning"
                  size="small"
                  variant="outlined"
                />
              </Stack>

              {preview.summary.valid === 0 ? (
                <Alert severity="warning">
                  No rows are ready to import. Fix invalid rows or remove duplicates from your
                  CSV.
                </Alert>
              ) : (
                <Alert severity="success" variant="outlined">
                  {preview.summary.valid} transaction
                  {preview.summary.valid === 1 ? "" : "s"} will be imported. Invalid and duplicate
                  rows will be skipped.
                </Alert>
              )}

              <TableContainer sx={{ maxHeight: 360 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>Row</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Title</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Notes</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {preview.rows.map((row) => (
                      <TableRow key={row.rowNumber} hover>
                        <TableCell>{row.rowNumber}</TableCell>
                        <TableCell>
                          <Chip
                            label={row.status}
                            size="small"
                            color={STATUS_COLORS[row.status]}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>{row.data?.title ?? "—"}</TableCell>
                        <TableCell>
                          {row.data ? formatCurrency(row.data.amount) : "—"}
                        </TableCell>
                        <TableCell>{row.data?.type ?? "—"}</TableCell>
                        <TableCell>{row.data?.category ?? "—"}</TableCell>
                        <TableCell>
                          {row.data ? formatDate(row.data.date) : "—"}
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">
                            {row.errors.join("; ") || "—"}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() => {
              setPreviewOpen(false);
              setImportOpen(true);
            }}
            disabled={importing}
          >
            Back
          </Button>
          <Button onClick={() => setPreviewOpen(false)} disabled={importing}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmImport}
            disabled={importing || !preview || preview.summary.valid === 0}
          >
            {importing ? "Importing..." : `Import ${preview?.summary.valid ?? 0} rows`}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
