const HUB = "https://fred-platform.vercel.app";

export type CoreNavItem = {
  n: string;
  label: string;
  href: string;
};

export const CORE_NAV: CoreNavItem[] = [
  { n: "01", label: "Architecture", href: "/core" },
  { n: "02", label: "Intake", href: HUB + "/core/intake" },
  { n: "03", label: "Invoice", href: HUB + "/core/invoice" },
  { n: "04", label: "GateZero", href: HUB + "/core/gatezero" },
  { n: "05", label: "Debt Lab", href: HUB + "/core/debt-optimizer" },
  { n: "06", label: "Radar", href: HUB + "/core/radar" },
  { n: "07", label: "Bridge", href: "/" },
  { n: "08", label: "Cast", href: HUB + "/core/cast" },
  { n: "09", label: "Vacuum", href: HUB + "/core/vacuum" },
  { n: "10", label: "Analyze", href: HUB + "/analyze" },
];
