import { NextRequest, NextResponse } from "next/server";
import { assertDatabaseUrl } from "@/lib/env";
import { requireApiUserId } from "@/lib/api-auth";
import { handleApiError, jsonError } from "@/lib/api-utils";
import { parseTransactionCsv } from "@/lib/csv-utils";
import type { ImportPreviewRow } from "@/lib/csv-transaction-import";
import { prepareImportPreview } from "@/lib/import-preview-service";

export const runtime = "nodejs";

const MAX_FILE_BYTES = 2 * 1024 * 1024;
const MAX_ROWS = 2000;

function serializePreviewRow(row: ImportPreviewRow) {
  return {
    rowNumber: row.rowNumber,
    status: row.status,
    errors: row.errors,
    data: row.data
      ? {
          title: row.data.title,
          amount: row.data.amount,
          type: row.data.type,
          category: row.data.category,
          date: row.data.date.toISOString(),
          importHash: row.data.importHash,
        }
      : null,
  };
}

export async function POST(request: NextRequest) {
  try {
    assertDatabaseUrl();
    const auth = await requireApiUserId();
    if (auth.unauthorized) return auth.unauthorized;

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return jsonError("CSV file is required", 400);
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      return jsonError("File must be a .csv file", 400);
    }

    if (file.size > MAX_FILE_BYTES) {
      return jsonError("CSV file must be 2 MB or smaller", 400);
    }

    const content = await file.text();
    const parsed = parseTransactionCsv(content);

    if (!parsed.success) {
      return jsonError(parsed.error, 400);
    }

    if (parsed.rows.length > MAX_ROWS) {
      return jsonError(`CSV cannot contain more than ${MAX_ROWS} rows`, 400);
    }

    const preview = await prepareImportPreview(auth.userId, parsed.rows);

    return NextResponse.json({
      rows: preview.rows.map(serializePreviewRow),
      summary: preview.summary,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
