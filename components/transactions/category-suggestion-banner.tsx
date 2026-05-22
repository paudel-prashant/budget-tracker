"use client";

import { Alert, Box, Button, Chip, Typography } from "@mui/material";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import type { CategorySuggestion } from "@/lib/category-suggestion-engine";

type CategorySuggestionBannerProps = {
  suggestion: CategorySuggestion | null;
  currentCategory: string;
  onApply: () => void;
  loading?: boolean;
};

export function CategorySuggestionBanner({
  suggestion,
  currentCategory,
  onApply,
  loading = false,
}: CategorySuggestionBannerProps) {
  if (!suggestion?.category) return null;

  const normalizedCurrent = currentCategory.trim().toLowerCase();
  const normalizedSuggested = suggestion.category.trim().toLowerCase();
  const alreadyApplied = normalizedCurrent === normalizedSuggested;

  const sourceLabel =
    suggestion.source === "learned" ? "From your saved choices" : "Based on title keywords";

  return (
    <Alert
      icon={<AutoAwesomeOutlinedIcon fontSize="small" />}
      severity="info"
      variant="outlined"
      sx={{
        alignItems: { xs: "flex-start", sm: "center" },
        "& .MuiAlert-message": { width: "100%" },
      }}
      action={
        !alreadyApplied ? (
          <Button color="inherit" size="small" onClick={onApply} disabled={loading}>
            Use
          </Button>
        ) : undefined
      }
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "flex-start", sm: "center" },
          gap: 1,
          flexWrap: "wrap",
        }}
      >
        <Typography variant="body2" component="span">
          Suggested category:
        </Typography>
        <Chip label={suggestion.category} size="small" color="primary" variant="outlined" />
        <Typography variant="caption" color="text.secondary" component="span">
          {sourceLabel}
        </Typography>
      </Box>
    </Alert>
  );
}
