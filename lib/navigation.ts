import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import AutorenewOutlinedIcon from "@mui/icons-material/AutorenewOutlined";
import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import type { SvgIconComponent } from "@mui/icons-material";

export type NavItem = {
  label: string;
  href: string;
  icon: SvgIconComponent;
};

export const mainNavItems: NavItem[] = [
  { label: "Dashboard", href: "/", icon: DashboardOutlinedIcon },
  { label: "Transactions", href: "/transactions", icon: ReceiptLongOutlinedIcon },
  { label: "Budget", href: "/budget", icon: AccountBalanceWalletOutlinedIcon },
  { label: "Recurring", href: "/recurring", icon: AutorenewOutlinedIcon },
  { label: "Insights", href: "/insights", icon: InsightsOutlinedIcon },
  { label: "Settings", href: "/settings", icon: SettingsOutlinedIcon },
];
