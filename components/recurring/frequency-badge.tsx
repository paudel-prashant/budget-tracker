import { Chip } from "@mui/material";
import type { RecurrenceFrequency } from "@/lib/types";

const FREQUENCY_CONFIG: Record<
  RecurrenceFrequency,
  { label: string; color: "default" | "primary" | "secondary" | "info" | "warning" }
> = {
  DAILY: { label: "Daily", color: "info" },
  WEEKLY: { label: "Weekly", color: "primary" },
  MONTHLY: { label: "Monthly", color: "secondary" },
  YEARLY: { label: "Yearly", color: "warning" },
};

type FrequencyBadgeProps = {
  frequency: RecurrenceFrequency;
};

export function FrequencyBadge({ frequency }: FrequencyBadgeProps) {
  const config = FREQUENCY_CONFIG[frequency];

  return (
    <Chip label={config.label} color={config.color} size="small" variant="outlined" />
  );
}
