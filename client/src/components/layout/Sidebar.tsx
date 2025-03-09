import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export default function Sidebar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  
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
        { href: "/messages", label: "Messages", icon: "chat" },
        { href: "/payments", label: "Payments", icon: "payments" },
        { href: "/account", label: "Account", icon: "person" },
      ];
      
  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="hidden lg:flex flex-col bg-white border-r border-gray-200 w-64 min-h-screen p-4">
      <div className="mb-8">
        <Link href="/">
          <a className="flex items-center">
            <h1 className="text-primary font-heading font-bold text-2xl">Glide</h1>
          </a>
        </Link>
      </div>
      
      <nav className="flex-1 space-y-2">
        {navLinks.map((link) => (
          <Link key={link.href} href={link.href}>
            <a className={`flex items-center px-4 py-3 rounded-lg ${
              location === link.href 
              ? "bg-secondary text-primary font-medium"
              : "text-text-medium hover:bg-gray-50"
            }`}>
              <span className="material-icons mr-3">{link.icon}</span>
              {link.label}
            </a>
          </Link>
        ))}
      </nav>
      
      {isLandlord && (
        <div className="mt-6 mb-8">
          <Link href="/landlord/leasing">
            <Button className="w-full bg-primary hover:bg-primary-light text-white">
              <span className="material-icons mr-2">add</span>
              Post a Listing
            </Button>
          </Link>
        </div>
      )}
      
      <div className="mt-auto border-t border-gray-200 pt-4">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center mr-3">
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
          <div>
            <p className="font-medium">{user?.firstName} {user?.lastName}</p>
            <p className="text-text-medium text-sm">{user?.email}</p>
          </div>
        </div>
        
        <Button 
          variant="outline" 
          className="w-full justify-start"
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
        >
          <span className="material-icons mr-2">logout</span>
          Sign Out
        </Button>
      </div>
    </div>
  );
}
