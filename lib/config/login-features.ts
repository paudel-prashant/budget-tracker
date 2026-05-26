import type { SvgIconComponent } from "@mui/icons-material";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";

export type LoginFeature = {
  icon: SvgIconComponent;
  title: string;
  description: string;
};

export const LOGIN_FEATURES: LoginFeature[] = [
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
];
