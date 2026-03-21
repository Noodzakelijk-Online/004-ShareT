
import { Share2, Home, PieChart } from "lucide-react";

/**
 * Central place for defining the navigation items. Used for navigation components.
 */
export const navItems = [
  {
    title: "Home",
    to: "/",
    icon: <Home className="h-4 w-4" />,
  },
  {
    title: "Trello External Share",
    to: "/app",
    icon: <Share2 className="h-4 w-4" />,
  },
  {
    title: "Dashboard",
    to: "/dashboard",
    icon: <PieChart className="h-4 w-4" />,
  },
];
