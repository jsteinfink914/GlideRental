import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export default function Navigation() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isLandlord = user?.userType === "landlord";

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Define navigation links based on user type
  const navLinks = isLandlord 
    ? [
        { href: "/landlord/leasing", label: "Leasing", icon: "apartment" },
        { href: "/landlord/buildings", label: "Buildings", icon: "location_city" },
        { href: "/messages", label: "Messages", icon: "chat" },
      ]
    : [
        { href: "/search", label: "Search", icon: "search" },
        { href: "/nearby", label: "Nearby", icon: "location_on" },
        { href: "/portal", label: "Home", icon: "home" },
        { href: "/messages", label: "Messages", icon: "chat" },
        { href: "/account", label: "Account", icon: "person" },
      ];

  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          {/* Logo */}
          <Link href="/">
            <div className="mr-4">
              <h1 className="text-primary font-heading font-bold text-2xl">Glide</h1>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-6">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <div
                  className={`font-medium ${
                    location === link.href
                      ? "text-primary border-b-2 border-primary"
                      : "text-text-medium hover:text-primary"
                  } transition px-2 py-1`}
                >
                  {link.label}
                </div>
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          {isLandlord && (
            <Link href="/landlord/leasing">
              <Button className="hidden md:block bg-secondary hover:bg-accent text-primary">
                Post a Listing
              </Button>
            </Link>
          )}

          {/* User menu */}
          <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center focus:outline-none">
                <div className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center">
                  {user?.profileImage ? (
                    <img
                      src={user.profileImage}
                      alt={`${user.firstName} ${user.lastName}`}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="material-icons">person</span>
                  )}
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link href="/account">
                  <div className="w-full cursor-pointer">Your Profile</div>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/account?tab=settings">
                  <div className="w-full cursor-pointer">Settings</div>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/account?tab=documents">
                  <div className="w-full cursor-pointer">Documents</div>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
                className="cursor-pointer"
              >
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
