import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";

export default function MobileNavigation() {
  const [location] = useLocation();
  const { user } = useAuth();
  
  const isLandlord = user?.userType === "landlord";
  
  // Define navigation links based on user type
  const navLinks = isLandlord
    ? [
        { href: "/landlord/leasing", label: "Leasing", icon: "apartment" },
        { href: "/landlord/buildings", label: "Buildings", icon: "location_city" },
        { href: "/messages", label: "Messages", icon: "chat" },
        { href: "/account", label: "Account", icon: "person" },
      ]
    : [
        { href: "/search", label: "Search", icon: "search" },
        { href: "/portal", label: "Home", icon: "home" },
        { href: "/neighborhood", label: "Nearby", icon: "location_on" },
        { href: "/messages", label: "Messages", icon: "chat" },
        { href: "/account", label: "Account", icon: "person" },
      ];

  return (
    <div className="block md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
      <div className="flex justify-around items-center">
        {navLinks.map((link) => (
          <Link key={link.href} href={link.href}>
            <div className={`flex flex-col items-center px-4 py-2 ${
              location === link.href ? "text-primary" : "text-text-medium"
            }`}>
              <span className="material-icons">{link.icon}</span>
              <span className="text-xs mt-1">{link.label}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
