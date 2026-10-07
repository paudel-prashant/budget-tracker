"use client";

import {
  Box,
  Chip,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import DriveFileMoveOutlinedIcon from "@mui/icons-material/DriveFileMoveOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import { SurfaceCard } from "@/components/shared/ui/surface-card";
import { CARD_PADDING } from "@/lib/config/layout-constants";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import type { Asset, Liability } from "@/lib/types";

type NetWorthItem = Asset | Liability;

type NetWorthItemCardProps = {
  item: NetWorthItem;
  variant: "asset" | "liability";
  onEdit: (item: NetWorthItem) => void;
  onDelete: (item: NetWorthItem) => void;
  /** Offered for items better tracked as an account (savings, TFSA, credit card). */
  onMoveToAccounts?: (item: NetWorthItem) => void;
  /** Name of an account that looks like the same thing — it would be counted twice. */
  possibleDuplicateOf?: string | null;
};

export function NetWorthItemCard({
  item,
  variant,
  onEdit,
  onDelete,
  onMoveToAccounts,
  possibleDuplicateOf,
}: NetWorthItemCardProps) {
  const valueColor = variant === "asset" ? "success.main" : "error.main";

  return (
    <SurfaceCard hover sx={{ p: CARD_PADDING, height: "100%" }}>
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="h6" fontWeight={700} noWrap>
            {item.name}
          </Typography>
          <Chip label={item.category} size="small" variant="outlined" sx={{ mt: 1 }} />
          {item.notes && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
              {item.notes}
            </Typography>
          )}
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: "block" }}>
            As of {formatDate(item.asOfDate)}
          </Typography>
        </Box>
        <Stack direction="row" alignItems="center" spacing={0.25}>
          {onMoveToAccounts && (
            <Tooltip title="Move to Accounts">
              <IconButton
                size="small"
                aria-label={`Move ${item.name} to Accounts`}
                onClick={() => onMoveToAccounts(item)}
                sx={{ color: "text.secondary" }}
              >
                <DriveFileMoveOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Edit">
            <IconButton
              size="small"
              aria-label={`Edit ${item.name}`}
              onClick={() => onEdit(item)}
              sx={{ color: "text.secondary" }}
            >
              <EditOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              size="small"
              aria-label={`Delete ${item.name}`}
              onClick={() => onDelete(item)}
              sx={{ color: "text.secondary" }}
            >
              <DeleteOutlineOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>
      <Typography variant="h5" fontWeight={700} color={valueColor} sx={{ mt: 2.5 }}>
        {formatCurrency(item.value)}
      </Typography>
      {possibleDuplicateOf && (
        <Typography variant="caption" color="warning.main" sx={{ display: "block", mt: 1 }}>
          Your “{possibleDuplicateOf}” account may be the same thing. If so, it&apos;s counted
          twice — delete this item and keep the account.
        </Typography>
      )}
    </SurfaceCard>
  );
}
