"use client";

import { Box, Typography } from "@mui/material";

function renderInlineBold(text: string, keyPrefix: string) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  if (parts.length === 1) {
    return text;
  }

  return parts.map((part, index) =>
    index % 2 === 1 ? (
      <Box component="span" key={`${keyPrefix}-${index}`} sx={{ fontWeight: 700 }}>
        {part}
      </Box>
    ) : (
      <Box component="span" key={`${keyPrefix}-${index}`}>
        {part}
      </Box>
    )
  );
}

type AssistantMessageBodyProps = {
  text: string;
};

export function AssistantMessageBody({ text }: AssistantMessageBodyProps) {
  const lines = text.split("\n");

  return (
    <Box sx={{ "& > * + *": { mt: 1 } }}>
      {lines.map((line, index) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <Box key={index} sx={{ height: 8 }} />;
        }

        if (trimmed.startsWith("•")) {
          return (
            <Typography
              key={index}
              variant="body2"
              component="div"
              sx={{ pl: 0.5, lineHeight: 1.55 }}
            >
              {renderInlineBold(trimmed, `line-${index}`)}
            </Typography>
          );
        }

        if (trimmed.startsWith("_") && trimmed.endsWith("_")) {
          return (
            <Typography
              key={index}
              variant="caption"
              color="text.secondary"
              component="div"
              sx={{ fontStyle: "italic" }}
            >
              {trimmed.slice(1, -1)}
            </Typography>
          );
        }

        return (
          <Typography key={index} variant="body2" component="div" sx={{ lineHeight: 1.55 }}>
            {renderInlineBold(line, `line-${index}`)}
          </Typography>
        );
      })}
    </Box>
  );
}
