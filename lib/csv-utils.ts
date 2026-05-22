const REQUIRED_HEADERS = ["title", "amount", "type", "category", "date"] as const;

export type CsvTransactionRow = Record<string, string>;

export function escapeCsvField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function buildCsvContent(headers: string[], rows: string[][]): string {
  const lines = [
    headers.map(escapeCsvField).join(","),
    ...rows.map((row) => row.map((cell) => escapeCsvField(String(cell ?? ""))).join(",")),
  ];
  return `${lines.join("\r\n")}\r\n`;
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        current += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      fields.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  fields.push(current.trim());
  return fields;
}

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/\s+/g, "");
}

export type ParseCsvResult =
  | { success: true; headers: string[]; rows: CsvTransactionRow[] }
  | { success: false; error: string };

export function parseTransactionCsv(content: string): ParseCsvResult {
  const trimmed = content.replace(/^\uFEFF/, "").trim();

  if (!trimmed) {
    return { success: false, error: "CSV file is empty" };
  }

  const lines = trimmed.split(/\r?\n/).filter((line) => line.trim().length > 0);

  if (lines.length < 2) {
    return {
      success: false,
      error: "CSV must include a header row and at least one data row",
    };
  }

  const headerFields = parseCsvLine(lines[0]).map(normalizeHeader);
  const missingHeaders = REQUIRED_HEADERS.filter((h) => !headerFields.includes(h));

  if (missingHeaders.length > 0) {
    return {
      success: false,
      error: `Missing required columns: ${missingHeaders.join(", ")}. Expected: ${REQUIRED_HEADERS.join(", ")}`,
    };
  }

  const rows: CsvTransactionRow[] = [];

  for (let i = 1; i < lines.length; i += 1) {
    const values = parseCsvLine(lines[i]);

    if (values.length === 1 && values[0] === "") {
      continue;
    }

    const row: CsvTransactionRow = {};

    headerFields.forEach((header, index) => {
      row[header] = values[index] ?? "";
    });

    rows.push(row);
  }

  if (rows.length === 0) {
    return { success: false, error: "No data rows found in CSV" };
  }

  return { success: true, headers: headerFields, rows };
}

export const CSV_EXPORT_HEADERS = [
  "title",
  "amount",
  "type",
  "category",
  "date",
  "createdAt",
] as const;
