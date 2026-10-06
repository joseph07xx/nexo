import {
  LayoutDashboard,
  Target,
  Activity,
  BarChart3,
  Sparkles,
  User,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  mobileHidden?: boolean;
}

export const navItems: NavItem[] = [
  {
    href: "/inicio",
    label: "Inicio",
    icon: LayoutDashboard,
  },
  {
    href: "/metas",
    label: "Metas",
    icon: Target,
  },
  {
    href: "/actividad",
    label: "Actividad",
    icon: Activity,
  },
  {
    href: "/estadisticas",
    label: "Estadísticas",
    icon: BarChart3,
    mobileHidden: true,
  },
  {
    href: "/nexo-ai",
    label: "Nexo AI",
    icon: Sparkles,
  },
  {
    href: "/perfil",
    label: "Perfil",
    icon: User,
    mobileHidden: true,
  },
];

export const mobileNavItems = navItems.filter((item) => !item.mobileHidden);