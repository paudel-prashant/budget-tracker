"use client";

import { Box, Button, IconButton, Stack, alpha, type Theme } from "@mui/material";
import type { SxProps } from "@mui/material/styles";
import ChevronLeftOutlinedIcon from "@mui/icons-material/ChevronLeftOutlined";
import ChevronRightOutlinedIcon from "@mui/icons-material/ChevronRightOutlined";

const PAGE_BUTTON_SIZE = 36;

type NumberedPaginationProps = {
  /** 1-based current page */
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
};

function buildPageItems(current: number, total: number): Array<number | "ellipsis"> {
  if (total <= 7) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const items: Array<number | "ellipsis"> = [1];

  if (current > 3) {
    items.push("ellipsis");
  }

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let page = start; page <= end; page += 1) {
    items.push(page);
  }

  if (current < total - 2) {
    items.push("ellipsis");
  }

  items.push(total);
  return items;
}

function PageCircle({
  pageNumber,
  active,
  disabled,
  onClick,
}: {
  pageNumber: number;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <IconButton
      onClick={onClick}
      disabled={disabled || active}
      aria-label={`Page ${pageNumber}`}
      aria-current={active ? "page" : undefined}
      sx={(theme) => ({
        width: PAGE_BUTTON_SIZE,
        height: PAGE_BUTTON_SIZE,
        borderRadius: "50%",
        fontSize: "0.875rem",
        fontWeight: 600,
        border: 1,
        borderColor: active ? alpha(theme.palette.primary.main, 0.45) : "divider",
        bgcolor: active ? alpha(theme.palette.primary.main, 0.14) : "background.paper",
        color: active ? "primary.main" : "text.secondary",
        boxShadow: active ? `0 0 0 1px ${alpha(theme.palette.primary.main, 0.2)}` : "none",
        transition: "background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease",
        "&:hover": {
          bgcolor: active
            ? alpha(theme.palette.primary.main, 0.14)
            : alpha(theme.palette.primary.main, 0.08),
          borderColor: active
            ? alpha(theme.palette.primary.main, 0.45)
            : alpha(theme.palette.primary.main, 0.25),
          color: active ? "primary.main" : "text.primary",
        },
        "&.Mui-disabled": {
          bgcolor: active ? alpha(theme.palette.primary.main, 0.14) : undefined,
          color: active ? "primary.main" : undefined,
          opacity: active ? 1 : 0.45,
        },
      })}
    >
      {pageNumber}
    </IconButton>
  );
}

const navButtonSx: SxProps<Theme> = {
  fontWeight: 600,
  minWidth: { xs: "auto", sm: 104 },
  color: "text.secondary",
  "&:hover:not(.Mui-disabled)": {
    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
    color: "text.primary",
  },
  "&.Mui-disabled": {
    color: "text.disabled",
  },
};

export function NumberedPagination({
  page,
  totalPages,
  onPageChange,
  disabled = false,
}: NumberedPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const safePage = Math.min(Math.max(page, 1), totalPages);
  const pageItems = buildPageItems(safePage, totalPages);

  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="center"
      flexWrap="wrap"
      gap={0.75}
      sx={{
        borderTop: 1,
        borderColor: "divider",
        px: { xs: 1.5, sm: 2 },
        py: 2,
        width: "100%",
      }}
    >
        <Button
          size="small"
          variant="text"
          disabled={disabled || safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
          startIcon={<ChevronLeftOutlinedIcon fontSize="small" />}
          sx={navButtonSx}
        >
          Previous
        </Button>

        <Stack direction="row" alignItems="center" spacing={0.5}>
          {pageItems.map((item, index) =>
            item === "ellipsis" ? (
              <Box
                key={`ellipsis-${index}`}
                component="span"
                sx={{
                  width: PAGE_BUTTON_SIZE,
                  textAlign: "center",
                  color: "text.disabled",
                  fontWeight: 600,
                  userSelect: "none",
                }}
              >
                …
              </Box>
            ) : (
              <PageCircle
                key={item}
                pageNumber={item}
                active={item === safePage}
                disabled={disabled}
                onClick={() => onPageChange(item)}
              />
            )
          )}
        </Stack>

        <Button
          size="small"
          variant="text"
          disabled={disabled || safePage >= totalPages}
          onClick={() => onPageChange(safePage + 1)}
          endIcon={<ChevronRightOutlinedIcon fontSize="small" />}
          sx={navButtonSx}
        >
        Next
      </Button>
    </Stack>
  );
}
