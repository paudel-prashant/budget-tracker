"use client";

import { Box, Stack, Typography, alpha, type SxProps, type Theme } from "@mui/material";
import type { SvgIconComponent } from "@mui/icons-material";
import AccountBalanceOutlinedIcon from "@mui/icons-material/AccountBalanceOutlined";
import ApartmentOutlinedIcon from "@mui/icons-material/ApartmentOutlined";
import AttachMoneyOutlinedIcon from "@mui/icons-material/AttachMoneyOutlined";
import BeachAccessOutlinedIcon from "@mui/icons-material/BeachAccessOutlined";
import BoltOutlinedIcon from "@mui/icons-material/BoltOutlined";
import BuildOutlinedIcon from "@mui/icons-material/BuildOutlined";
import BusinessCenterOutlinedIcon from "@mui/icons-material/BusinessCenterOutlined";
import CardGiftcardOutlinedIcon from "@mui/icons-material/CardGiftcardOutlined";
import CasinoOutlinedIcon from "@mui/icons-material/CasinoOutlined";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import CheckroomOutlinedIcon from "@mui/icons-material/CheckroomOutlined";
import ChildCareOutlinedIcon from "@mui/icons-material/ChildCareOutlined";
import CreditCardOutlinedIcon from "@mui/icons-material/CreditCardOutlined";
import DiamondOutlinedIcon from "@mui/icons-material/DiamondOutlined";
import DirectionsBusOutlinedIcon from "@mui/icons-material/DirectionsBusOutlined";
import DirectionsCarOutlinedIcon from "@mui/icons-material/DirectionsCarOutlined";
import FitnessCenterOutlinedIcon from "@mui/icons-material/FitnessCenterOutlined";
import FlightOutlinedIcon from "@mui/icons-material/FlightOutlined";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import HomeWorkOutlinedIcon from "@mui/icons-material/HomeWorkOutlined";
import LaptopMacOutlinedIcon from "@mui/icons-material/LaptopMacOutlined";
import LocalBarOutlinedIcon from "@mui/icons-material/LocalBarOutlined";
import LocalCafeOutlinedIcon from "@mui/icons-material/LocalCafeOutlined";
import LocalGasStationOutlinedIcon from "@mui/icons-material/LocalGasStationOutlined";
import LocalGroceryStoreOutlinedIcon from "@mui/icons-material/LocalGroceryStoreOutlined";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import MedicalServicesOutlinedIcon from "@mui/icons-material/MedicalServicesOutlined";
import MovieOutlinedIcon from "@mui/icons-material/MovieOutlined";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import PetsOutlinedIcon from "@mui/icons-material/PetsOutlined";
import PhoneIphoneOutlinedIcon from "@mui/icons-material/PhoneIphoneOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import RequestQuoteOutlinedIcon from "@mui/icons-material/RequestQuoteOutlined";
import RestaurantOutlinedIcon from "@mui/icons-material/RestaurantOutlined";
import SavingsOutlinedIcon from "@mui/icons-material/SavingsOutlined";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import ShowChartOutlinedIcon from "@mui/icons-material/ShowChartOutlined";
import SpaOutlinedIcon from "@mui/icons-material/SpaOutlined";
import SportsEsportsOutlinedIcon from "@mui/icons-material/SportsEsportsOutlined";
import SubscriptionsOutlinedIcon from "@mui/icons-material/SubscriptionsOutlined";
import SwapHorizOutlinedIcon from "@mui/icons-material/SwapHorizOutlined";
import VolunteerActivismOutlinedIcon from "@mui/icons-material/VolunteerActivismOutlined";
import WifiOutlinedIcon from "@mui/icons-material/WifiOutlined";
import { getCategoryAppearance, type CategoryIconKey } from "@/lib/domain/category-appearance";

const ICONS: Record<CategoryIconKey, SvgIconComponent> = {
  groceries: LocalGroceryStoreOutlinedIcon,
  restaurant: RestaurantOutlinedIcon,
  coffee: LocalCafeOutlinedIcon,
  bar: LocalBarOutlinedIcon,
  fuel: LocalGasStationOutlinedIcon,
  car: DirectionsCarOutlinedIcon,
  transit: DirectionsBusOutlinedIcon,
  flight: FlightOutlinedIcon,
  utilities: BoltOutlinedIcon,
  phone: PhoneIphoneOutlinedIcon,
  internet: WifiOutlinedIcon,
  subscriptions: SubscriptionsOutlinedIcon,
  movie: MovieOutlinedIcon,
  gaming: SportsEsportsOutlinedIcon,
  health: MedicalServicesOutlinedIcon,
  household: HomeOutlinedIcon,
  rent: ApartmentOutlinedIcon,
  insurance: ShieldOutlinedIcon,
  education: SchoolOutlinedIcon,
  apparel: CheckroomOutlinedIcon,
  beauty: SpaOutlinedIcon,
  shopping: ShoppingBagOutlinedIcon,
  gift: CardGiftcardOutlinedIcon,
  charity: VolunteerActivismOutlinedIcon,
  salary: PaymentsOutlinedIcon,
  business: BusinessCenterOutlinedIcon,
  freelance: LaptopMacOutlinedIcon,
  investments: ShowChartOutlinedIcon,
  lottery: CasinoOutlinedIcon,
  pets: PetsOutlinedIcon,
  fitness: FitnessCenterOutlinedIcon,
  kids: ChildCareOutlinedIcon,
  gold: DiamondOutlinedIcon,
  cash: SavingsOutlinedIcon,
  bank: AccountBalanceOutlinedIcon,
  realEstate: HomeWorkOutlinedIcon,
  retirement: BeachAccessOutlinedIcon,
  creditCard: CreditCardOutlinedIcon,
  loan: RequestQuoteOutlinedIcon,
  tax: ReceiptLongOutlinedIcon,
  transfer: SwapHorizOutlinedIcon,
  repairs: BuildOutlinedIcon,
  income: AttachMoneyOutlinedIcon,
  other: CategoryOutlinedIcon,
  tag: LocalOfferOutlinedIcon,
};

const SIZES = {
  small: { box: 24, icon: 15, radius: 1.25 },
  medium: { box: 34, icon: 19, radius: 1.75 },
  large: { box: 44, icon: 24, radius: 2.25 },
} as const;

type CategoryIconProps = {
  category: string | null | undefined;
  size?: keyof typeof SIZES;
  sx?: SxProps<Theme>;
};

/** Coloured rounded tile with the category's icon. Decorative — pair it with the name. */
export function CategoryIcon({ category, size = "medium", sx }: CategoryIconProps) {
  const { icon, color } = getCategoryAppearance(category);
  const Icon = ICONS[icon];
  const dims = SIZES[size];

  return (
    <Box
      aria-hidden
      sx={[
        (theme) => ({
          width: dims.box,
          height: dims.box,
          flexShrink: 0,
          borderRadius: dims.radius,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          color,
          bgcolor: alpha(color, theme.palette.mode === "dark" ? 0.22 : 0.12),
          boxShadow: `inset 0 0 0 1px ${alpha(color, 0.18)}`,
        }),
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      <Icon sx={{ fontSize: dims.icon }} />
    </Box>
  );
}

type CategoryLabelProps = {
  category: string;
  size?: "small" | "medium";
  /** Extra content after the name (e.g. a "Split" chip). */
  children?: React.ReactNode;
};

/** Icon + category name on one line, for tables and lists. */
export function CategoryLabel({ category, size = "small", children }: CategoryLabelProps) {
  return (
    <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0 }}>
      <CategoryIcon category={category} size={size} />
      <Typography variant="body2" component="span" noWrap>
        {category}
      </Typography>
      {children}
    </Stack>
  );
}
