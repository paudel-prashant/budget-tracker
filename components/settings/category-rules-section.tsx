"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Collapse,
  Divider,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import PlaylistAddCheckOutlinedIcon from "@mui/icons-material/PlaylistAddCheckOutlined";
import { useSnackbar } from "@/components/shared/providers/snackbar-provider";
import {
  CategoryRuleDialog,
  MATCH_TYPE_LABELS,
  type CategoryRuleDraft,
} from "@/components/settings/category-rule-dialog";
import { CARD_PADDING } from "@/lib/config/layout-constants";
import type { CategoryRuleMatchType } from "@/lib/domain/category-rules";
import type { TransactionType } from "@/lib/types";

type CategoryRule = {
  id: string;
  pattern: string;
  matchType: CategoryRuleMatchType;
  type: TransactionType | null;
  category: string;
  tags: string[];
  matchingTransactions: number;
};

type LearnedMapping = {
  id: string;
  titleKey: string;
  category: string;
  type: TransactionType;
};

async function readError(response: Response, fallback: string): Promise<string> {
  try {
    const data = (await response.json()) as { error?: string };
    return data.error ?? fallback;
  } catch {
    return fallback;
  }
}

function typeLabel(type: TransactionType | null): string {
  return type === "INCOME" ? "income" : type === "EXPENSE" ? "expenses" : "any transaction";
}

export function CategoryRulesSection() {
  const { showSuccess, showError } = useSnackbar();
  const [rules, setRules] = useState<CategoryRule[]>([]);
  const [mappings, setMappings] = useState<LearnedMapping[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draft, setDraft] = useState<CategoryRuleDraft | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showLearned, setShowLearned] = useState(false);

  const load = useCallback(async () => {
    try {
      const [rulesResponse, mappingsResponse] = await Promise.all([
        fetch("/api/category-rules"),
        fetch("/api/category-mappings"),
      ]);
      if (!rulesResponse.ok) throw new Error(await readError(rulesResponse, "Failed to load rules"));
      setRules(((await rulesResponse.json()) as { rules: CategoryRule[] }).rules);
      if (mappingsResponse.ok) {
        setMappings(((await mappingsResponse.json()) as { mappings: LearnedMapping[] }).mappings);
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to load rules");
    } finally {
      setLoaded(true);
    }
  }, [showError]);

  useEffect(() => {
    void load();
  }, [load]);

  const openDialog = (initial: CategoryRuleDraft | null) => {
    setDraft(initial);
    setDialogOpen(true);
  };

  const applyRule = async (ruleId: string) => {
    setBusyId(ruleId);
    try {
      const response = await fetch(`/api/category-rules/${ruleId}/apply`, { method: "POST" });
      if (!response.ok) throw new Error(await readError(response, "Failed to apply rule"));
      const { updated } = (await response.json()) as { updated: number };
      showSuccess(
        updated === 0
          ? "Existing transactions already match this rule"
          : `Updated ${updated} existing ${updated === 1 ? "transaction" : "transactions"}`
      );
      await load();
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to apply rule");
    } finally {
      setBusyId(null);
    }
  };

  const deleteRule = async (ruleId: string) => {
    setBusyId(ruleId);
    try {
      const response = await fetch(`/api/category-rules/${ruleId}`, { method: "DELETE" });
      if (!response.ok) throw new Error(await readError(response, "Failed to delete rule"));
      setRules((prev) => prev.filter((rule) => rule.id !== ruleId));
      showSuccess("Rule deleted");
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to delete rule");
    } finally {
      setBusyId(null);
    }
  };

  const deleteMapping = async (mappingId: string) => {
    setBusyId(mappingId);
    try {
      const response = await fetch(`/api/category-mappings/${mappingId}`, { method: "DELETE" });
      if (!response.ok) throw new Error(await readError(response, "Failed to forget mapping"));
      setMappings((prev) => prev.filter((mapping) => mapping.id !== mappingId));
    } catch (err) {
      showError(err instanceof Error ? err.message : "Failed to forget mapping");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Stack sx={{ p: CARD_PADDING }} spacing={1.5}>
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1}>
        <Box>
          <Typography variant="subtitle1">Category rules</Typography>
          <Typography variant="body2" color="text.secondary">
            Automatically categorize and tag transactions by title — for new entries and CSV
            imports. When several rules match, the most specific one wins.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          size="small"
          startIcon={<AddOutlinedIcon />}
          onClick={() => openDialog(null)}
          sx={{ alignSelf: { sm: "flex-start" }, flexShrink: 0 }}
        >
          New rule
        </Button>
      </Stack>

      {loaded && rules.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          No rules yet. Try one like &ldquo;title contains <strong>uber</strong> →
          Transportation&rdquo;, or turn a learned mapping below into a rule.
        </Typography>
      )}

      {rules.length > 0 && (
        <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2 }}>
          {rules.map((rule, index) => (
            <Box key={rule.id}>
              {index > 0 && <Divider />}
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1}
                alignItems={{ sm: "center" }}
                sx={{ px: 2, py: 1.25 }}
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2">
                    {typeLabel(rule.type).replace(/^./, (c) => c.toUpperCase())} whose title{" "}
                    {MATCH_TYPE_LABELS[rule.matchType]} <strong>&ldquo;{rule.pattern}&rdquo;</strong>{" "}
                    → <strong>{rule.category}</strong>
                  </Typography>
                  <Stack direction="row" spacing={0.5} useFlexGap sx={{ mt: 0.5, flexWrap: "wrap" }}>
                    {rule.tags.map((tag) => (
                      <Chip key={tag} label={`#${tag}`} size="small" variant="outlined" sx={{ height: 20 }} />
                    ))}
                    <Typography variant="caption" color="text.secondary">
                      Matches {rule.matchingTransactions} existing{" "}
                      {rule.matchingTransactions === 1 ? "transaction" : "transactions"}
                    </Typography>
                  </Stack>
                </Box>
                <Stack direction="row" spacing={0.5} sx={{ flexShrink: 0 }}>
                  <Tooltip title="Apply to existing transactions">
                    <span>
                      <IconButton
                        size="small"
                        aria-label={`Apply rule ${rule.pattern} to existing transactions`}
                        disabled={busyId === rule.id || rule.matchingTransactions === 0}
                        onClick={() => void applyRule(rule.id)}
                      >
                        <PlaylistAddCheckOutlinedIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Edit rule">
                    <IconButton
                      size="small"
                      aria-label={`Edit rule ${rule.pattern}`}
                      onClick={() => openDialog(rule)}
                    >
                      <EditOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete rule">
                    <span>
                      <IconButton
                        size="small"
                        color="error"
                        aria-label={`Delete rule ${rule.pattern}`}
                        disabled={busyId === rule.id}
                        onClick={() => void deleteRule(rule.id)}
                      >
                        <DeleteOutlineOutlinedIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Stack>
              </Stack>
            </Box>
          ))}
        </Box>
      )}

      {mappings.length > 0 && (
        <Box>
          <Button size="small" onClick={() => setShowLearned((prev) => !prev)}>
            {showLearned ? "Hide" : "Show"} {mappings.length} learned{" "}
            {mappings.length === 1 ? "mapping" : "mappings"}
          </Button>
          <Collapse in={showLearned} unmountOnExit>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
              Budgetrax remembers the category you pick for each title and suggests it next time.
              Rules take priority over these.
            </Typography>
            <Box sx={{ border: 1, borderColor: "divider", borderRadius: 2, maxHeight: 320, overflowY: "auto" }}>
              {mappings.map((mapping, index) => (
                <Box key={mapping.id}>
                  {index > 0 && <Divider />}
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 2, py: 0.75 }}>
                    <Typography variant="body2" sx={{ flex: 1, minWidth: 0 }} noWrap>
                      &ldquo;{mapping.titleKey}&rdquo; → {mapping.category}
                      <Typography component="span" variant="caption" color="text.secondary">
                        {" "}
                        ({mapping.type === "INCOME" ? "income" : "expense"})
                      </Typography>
                    </Typography>
                    <Button
                      size="small"
                      onClick={() =>
                        openDialog({
                          pattern: mapping.titleKey,
                          matchType: "CONTAINS",
                          type: mapping.type,
                          category: mapping.category,
                          tags: [],
                        })
                      }
                    >
                      Make rule
                    </Button>
                    <Tooltip title="Forget">
                      <span>
                        <IconButton
                          size="small"
                          aria-label={`Forget mapping ${mapping.titleKey}`}
                          disabled={busyId === mapping.id}
                          onClick={() => void deleteMapping(mapping.id)}
                        >
                          <DeleteOutlineOutlinedIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Stack>
                </Box>
              ))}
            </Box>
          </Collapse>
        </Box>
      )}

      <CategoryRuleDialog
        open={dialogOpen}
        initial={draft}
        onClose={() => setDialogOpen(false)}
        onSaved={async (isNew) => {
          await load();
          showSuccess(
            isNew
              ? "Rule created. Use the ✓ button to also apply it to existing transactions."
              : "Rule updated"
          );
        }}
      />
    </Stack>
  );
}
