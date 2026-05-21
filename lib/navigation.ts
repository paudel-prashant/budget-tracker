import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
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
  { label: "Reports", href: "/reports", icon: AssessmentOutlinedIcon },
  { label: "Settings", href: "/settings", icon: SettingsOutlinedIcon },
];
