"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Box,
  Chip,
  CircularProgress,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import PersonOutlineRoundedIcon from "@mui/icons-material/PersonOutlineRounded";
import { AssistantMessageBody } from "@/components/assistant/assistant-message-body";
import { useSnackbar } from "@/components/shared/providers/snackbar-provider";
import { DEFAULT_SUGGESTED_QUESTIONS } from "@/lib/assistant/suggested-questions";
import type { AssistantInsight, AssistantReply } from "@/lib/assistant/types";

type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  insights?: AssistantInsight[];
};

function newId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function InsightChips({ insights }: { insights: AssistantInsight[] }) {
  if (!insights.length) return null;

  return (
    <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mt: 1.25 }}>
      {insights.slice(0, 4).map((item) => (
        <Chip
          key={item.key}
          size="small"
          label={item.title}
          color={
            item.severity === "warning"
              ? "warning"
              : item.severity === "positive"
                ? "success"
                : "default"
          }
          variant="outlined"
          sx={{ maxWidth: "100%" }}
        />
      ))}
    </Stack>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const theme = useTheme();
  const isUser = message.role === "user";

  return (
    <Stack
      direction="row"
      spacing={1.25}
      justifyContent={isUser ? "flex-end" : "flex-start"}
      sx={{ width: "100%" }}
    >
      {!isUser && (
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: 1.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            bgcolor: alpha(theme.palette.primary.main, 0.12),
            color: "primary.main",
          }}
        >
          <AutoAwesomeOutlinedIcon sx={{ fontSize: 18 }} />
        </Box>
      )}

      <Box
        sx={{
          maxWidth: "88%",
          px: 1.5,
          py: 1.25,
          borderRadius: 2,
          border: 1,
          borderColor: isUser ? "transparent" : "divider",
          bgcolor: isUser
            ? alpha(theme.palette.primary.main, 0.14)
            : alpha(theme.palette.background.paper, 0.9),
        }}
      >
        {isUser ? (
          <Typography variant="body2" sx={{ lineHeight: 1.55, fontSize: "0.8125rem" }}>
            {message.content}
          </Typography>
        ) : (
          <>
            <AssistantMessageBody text={message.content} />
            {message.insights && <InsightChips insights={message.insights} />}
          </>
        )}
      </Box>

      {isUser && (
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: 1.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            bgcolor: alpha(theme.palette.text.primary, 0.06),
            color: "text.secondary",
          }}
        >
          <PersonOutlineRoundedIcon sx={{ fontSize: 18 }} />
        </Box>
      )}
    </Stack>
  );
}

function TypingIndicator() {
  const theme = useTheme();

  return (
    <Stack direction="row" spacing={1.25} alignItems="center">
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: 1.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: alpha(theme.palette.primary.main, 0.12),
          color: "primary.main",
        }}
      >
        <AutoAwesomeOutlinedIcon sx={{ fontSize: 18 }} />
      </Box>
      <Stack
        direction="row"
        spacing={0.75}
        alignItems="center"
        sx={{
          px: 1.5,
          py: 1.25,
          borderRadius: 2,
          border: 1,
          borderColor: "divider",
        }}
      >
        <CircularProgress size={14} thickness={5} />
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.8125rem" }}>
          Analyzing your transactions…
        </Typography>
      </Stack>
    </Stack>
  );
}

type AssistantChatPanelProps = {
  onClose?: () => void;
  compact?: boolean;
};

export function AssistantChatPanel({ onClose, compact = false }: AssistantChatPanelProps) {
  const theme = useTheme();
  const { showError } = useSnackbar();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi — I’m your Budgetrax financial assistant. Ask about spending trends, category changes, savings ideas, top expenses, or unusual charges. Answers use AI-powered financial insights from your transaction data.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggested, setSuggested] = useState<string[]>([...DEFAULT_SUGGESTED_QUESTIONS]);
  const [showAllSuggestions, setShowAllSuggestions] = useState(false);

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, scrollToBottom]);

  useEffect(() => {
    fetch("/api/assistant")
      .then((res) => (res.ok ? res.json() : null))
      .then(
        (data: { suggestedQuestions?: string[]; allSuggestedQuestions?: string[] } | null) => {
          if (data?.allSuggestedQuestions?.length) {
            setSuggested(data.allSuggestedQuestions);
          } else if (data?.suggestedQuestions?.length) {
            setSuggested(data.suggestedQuestions);
          }
        }
      )
      .catch(() => undefined);
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      setInput("");
      setMessages((prev) => [
        ...prev,
        { id: newId(), role: "user", content: trimmed },
      ]);
      setLoading(true);

      try {
        const response = await fetch("/api/assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: trimmed }),
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(
            typeof err.error === "string" ? err.error : "Could not get a response"
          );
        }

        const data = (await response.json()) as AssistantReply;
        setMessages((prev) => [
          ...prev,
          {
            id: newId(),
            role: "assistant",
            content: data.message,
            insights: data.insights,
          },
        ]);
        if (data.suggestedQuestions?.length) {
          setSuggested((prev) => {
            const seen = new Set<string>();
            const merged: string[] = [];
            for (const q of [...data.suggestedQuestions, ...prev]) {
              const key = q.toLowerCase();
              if (!seen.has(key)) {
                seen.add(key);
                merged.push(q);
              }
            }
            return merged;
          });
        }
      } catch (error) {
        showError(error instanceof Error ? error.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    },
    [loading, showError]
  );

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    void sendMessage(input);
  };

  return (
    <Paper
      elevation={8}
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        maxHeight: "100%",
        minHeight: 0,
        overflow: "hidden",
        borderRadius: 3,
        border: 1,
        borderColor: alpha(theme.palette.primary.main, 0.25),
        bgcolor: "background.paper",
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 1.5,
          borderBottom: 1,
          borderColor: "divider",
          background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, transparent 65%)`,
          flexShrink: 0,
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
          <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
            <AutoAwesomeOutlinedIcon color="primary" sx={{ fontSize: 22 }} />
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography
                variant="subtitle2"
                fontWeight={700}
                sx={{ textTransform: "none", lineHeight: 1.3 }}
              >
                Financial insights
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ textTransform: "none", display: "block", lineHeight: 1.35 }}
              >
                AI-powered · from your data
              </Typography>
            </Box>
          </Stack>
          {onClose && (
            <IconButton
              size="small"
              onClick={onClose}
              aria-label="Close assistant"
              sx={{ flexShrink: 0, ml: 0.5 }}
            >
              <CloseRoundedIcon fontSize="small" />
            </IconButton>
          )}
        </Stack>
      </Box>

      <Box
        ref={scrollRef}
        sx={{
          flex: 1,
          overflowY: "auto",
          px: 2,
          py: 2,
          display: "flex",
          flexDirection: "column",
          gap: 1.75,
          minHeight: 0,
        }}
      >
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {loading && <TypingIndicator />}
      </Box>

      <Box
        sx={{
          px: 2,
          pt: 1.5,
          pb: 1.75,
          borderTop: 1,
          borderColor: "divider",
          bgcolor: alpha(theme.palette.background.default, 0.6),
          flexShrink: 0,
          display: "flex",
          flexDirection: "column",
          gap: 0.75,
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={1}
          sx={{ flexShrink: 0 }}
        >
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ textTransform: "none", flexShrink: 0 }}
          >
            Suggested questions
          </Typography>
          {suggested.length > (compact ? 6 : 10) && (
            <Typography
              component="button"
              type="button"
              variant="caption"
              onClick={() => setShowAllSuggestions((v) => !v)}
              sx={{
                border: 0,
                p: 0,
                bgcolor: "transparent",
                color: "primary.main",
                cursor: "pointer",
                fontWeight: 600,
                textTransform: "none",
                flexShrink: 0,
                whiteSpace: "nowrap",
                "&:hover": { textDecoration: "underline" },
              }}
            >
              {showAllSuggestions ? "Show fewer" : `Show all (${suggested.length})`}
            </Typography>
          )}
        </Stack>
        <Stack
          direction="row"
          flexWrap="wrap"
          gap={0.5}
          alignContent="flex-start"
          sx={{
            flexShrink: 1,
            minHeight: 0,
            maxHeight: showAllSuggestions
              ? compact
                ? "min(120px, 20dvh)"
                : "min(150px, 18dvh)"
              : compact
                ? 80
                : 92,
            overflowY: "auto",
            overflowX: "hidden",
            pr: 0.5,
            scrollbarWidth: "thin",
          }}
        >
          {(showAllSuggestions
            ? suggested
            : suggested.slice(0, compact ? 6 : 10)
          ).map((question) => (
                <Chip
                  key={question}
                  label={question}
                  size="small"
                  clickable
                  disabled={loading}
                  onClick={() => void sendMessage(question)}
                  sx={{
                    maxWidth: "100%",
                    height: "auto",
                    "& .MuiChip-label": {
                      whiteSpace: "normal",
                      py: 0.5,
                      fontSize: "0.7rem",
                      lineHeight: 1.3,
                      textTransform: "none",
                    },
                  }}
                />
              ))}
        </Stack>

        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{ flexShrink: 0, flexGrow: 0, width: "100%" }}
        >
          <TextField
            fullWidth
            size="small"
            placeholder="Ask about spending, savings…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end" sx={{ alignSelf: "center" }}>
                  <IconButton
                    type="submit"
                    color="primary"
                    size="small"
                    disabled={!input.trim() || loading}
                    aria-label="Send message"
                  >
                    <SendRoundedIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
              sx: {
                borderRadius: 2,
                bgcolor: "background.paper",
                fontSize: "0.8125rem",
                py: 1.1,
              },
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                alignItems: "center",
              },
            }}
          />
        </Box>
      </Box>
    </Paper>
  );
}
