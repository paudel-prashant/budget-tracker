"use client";

import {
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
  alpha,
  useTheme,
} from "@mui/material";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";
import { BrandLogo } from "@/components/shared/brand-logo";
import { APP_DESCRIPTION, APP_NAME, APP_TAGLINE } from "@/lib/config/app";

const FEATURES = [
  {
    icon: DashboardOutlinedIcon,
    title: "Dashboard at a glance",
    description: "See spending, income, and cash flow in one place.",
  },
  {
    icon: ReceiptLongOutlinedIcon,
    title: "Transactions & imports",
    description: "Log expenses quickly or bring in history from CSV.",
  },
  {
    icon: AccountBalanceWalletOutlinedIcon,
    title: "Budgets that stick",
    description: "Set category limits and track progress through the month.",
  },
  {
    icon: InsightsOutlinedIcon,
    title: "Insights & reports",
    description: "Spot trends, recurring charges, and monthly summaries.",
  },
] as const;

export function LoginHeroPanel() {
  const theme = useTheme();

  return (
    <Stack spacing={4} sx={{ maxWidth: 480, width: "100%" }}>
      <Stack direction="row" spacing={2} alignItems="center">
        <BrandLogo
          size={56}
          priority
          sx={{
            borderRadius: 2.5,
            boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.3)}`,
          }}
        />
        <Box>
          <Typography variant="h5" component="p" fontWeight={700} lineHeight={1.2}>
            {APP_NAME}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            {APP_TAGLINE}
          </Typography>
        </Box>
      </Stack>

      <Box>
        <Typography variant="h4" component="h1" fontWeight={700} sx={{ letterSpacing: "-0.02em" }}>
          Personal finance,{" "}
          <Box component="span" sx={{ color: "primary.main" }}>
            organized
          </Box>
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 1.5, lineHeight: 1.7 }}>
          {APP_DESCRIPTION}
        </Typography>
      </Box>

      <List disablePadding sx={{ "& .MuiListItem-root": { alignItems: "flex-start", py: 1.25 } }}>
        {FEATURES.map(({ icon: Icon, title, description }) => (
          <ListItem key={title} disableGutters>
            <ListItemIcon sx={{ minWidth: 44, mt: 0.25 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 2,
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: "primary.main",
                }}
              >
                <Icon fontSize="small" />
              </Box>
            </ListItemIcon>
            <ListItemText
              primary={title}
              secondary={description}
              primaryTypographyProps={{ fontWeight: 600, variant: "subtitle2" }}
              secondaryTypographyProps={{ variant: "body2", sx: { mt: 0.25 } }}
            />
          </ListItem>
        ))}
      </List>
    </Stack>
  );
}
