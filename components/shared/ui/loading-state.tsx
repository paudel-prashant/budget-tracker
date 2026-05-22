import { Box, CircularProgress, Typography } from "@mui/material";

type LoadingStateProps = {
  message?: string;
  minHeight?: number | string;
};

export function LoadingState({
  message = "Loading...",
  minHeight = 280,
}: LoadingStateProps) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        minHeight,
        py: 4,
      }}
    >
      <CircularProgress size={36} />
      <Typography variant="body2" color="text.secondary">
        {message}
      </Typography>
    </Box>
  );
}
