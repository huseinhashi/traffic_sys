//src/components/layouts/DashboardLayout.jsx
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  UserCog,
  LogOut,
  Shield,
  X,
  ChevronRight,
  ChevronLeft,
  Car,
  MapPin,
  MessageSquare,
  Bell,
  Settings,
  UserCircle,
  AlertTriangle,
  Users,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

// Header Component
const Header = ({ onMenuClick, isSidebarCollapsed, toggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const notifications = [
    {
      id: 1,
      title: "New traffic jam reported",
      message: "Critical level jam reported at Main Street intersection.",
      time: "5 minutes ago",
      type: "critical"
    },
    {
      id: 2,
      title: "Jam resolved",
      message: "Traffic jam at Central Avenue has been cleared",
      time: "10 minutes ago",
      type: "success"
    },
    {
      id: 3,
      title: "New user registered",
      message: "A new user has joined the traffic monitoring system",
      time: "30 minutes ago",
      type: "info"
    }
  ];

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'critical':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'info':
        return <Shield className="h-5 w-5 text-blue-500" />;
      case 'success':
        return <Shield className="h-5 w-5 text-green-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-6">
      <div className="flex items-center gap-2 md:gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          className="hidden lg:flex"
          onClick={toggleSidebar}
        >
          {isSidebarCollapsed ? 
            <ChevronRight className="h-5 w-5" /> : 
            <ChevronLeft className="h-5 w-5" />
          }
        </Button>

        <Link
          to="/"
          className="flex items-center gap-2 font-semibold hover:opacity-80 transition-opacity"
        >
          <Car className="h-6 w-6 text-primary" />
          <span className="hidden md:inline-block text-lg">
            Traffic Jam Management
          </span>
        </Link>
      </div>
      
      <div className="flex items-center gap-2">
        {/* ThemeToggle Component */}
        <ThemeToggle />

        {/* Notifications */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
                  {notifications.length}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0">
            <div className="p-4 border-b">
              <h3 className="font-medium">Notifications</h3>
            </div>
            <div className="max-h-80 overflow-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground text-center">
                  No new notifications
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="flex items-start gap-3 p-4 border-b last:border-0 hover:bg-muted/50 transition-colors"
                  >
                    <div className="mt-1">{getNotificationIcon(notification.type)}</div>
                    <div className="flex-1 space-y-1">
                      <div className="font-medium">{notification.title}</div>
                      <div className="text-sm text-muted-foreground">{notification.message}</div>
                      <div className="text-xs text-muted-foreground">{notification.time}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="p-2 border-t text-center">
              <Button variant="ghost" size="sm" className="w-full text-xs">
                View all notifications
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-8 w-8 rounded-full"
              aria-label="User menu"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatar ? `${import.meta.env.VITE_API_URL}/uploads/${user.avatar}` : undefined} alt={user?.name} />
                <AvatarFallback>{getInitials(user?.name)}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
                <p className="text-xs leading-none text-muted-foreground capitalize">
                  {user?.role}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => navigate("/admin/profile")}
              className="cursor-pointer"
            >
              <UserCircle className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigate("/admin/settings")}
              className="cursor-pointer"
            >
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="cursor-pointer text-red-600 focus:text-red-600"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

// Main DashboardLayout Component
export const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Navigation items for traffic jam system
  const navItems = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      href: "/admin/",
      description: "Overview of traffic jams and system status",
    },
    {
      title: "User Management",
      icon: UserCog,
      href: "/admin/users",
      description: "Manage users and administrators",
    },
    {
      title: "Traffic Jams",
      icon: Car,
      href: "/admin/jams",
      description: "View and manage traffic jam reports",
    },
    // {
    //   title: "Map View",
    //   icon: MapPin,
    //   href: "/admin/map",
    //   description: "Interactive map of traffic conditions",
    //   comingSoon: true,
    // },
    {
      title: "Conversations",
      icon: Users,
      href: "/admin/conversations",
      description: "View and manage user conversations",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/20 lg:hidden z-40 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-card/50 backdrop-blur-xl border-r border-border/40 transition-all duration-300 ease-in-out",
          isSidebarOpen ? "w-64" : "w-20",
          "lg:transform-none",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Sidebar Header */}
        <div className={cn(
          "flex h-16 items-center border-b border-border/40",
          isSidebarOpen ? "px-6 justify-between" : "px-4 justify-center"
        )}>
          {isSidebarOpen ? (
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Car className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-foreground">Traffic Jam</span>
                <span className="text-xs text-muted-foreground">Management</span>
              </div>
            </div>
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Car className="h-5 w-5 text-primary-foreground" />
            </div>
          )}
          
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden p-1.5 hover:bg-muted/80 rounded-md transition-colors"
          >
            <X className="h-4 w-4 text-foreground" />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 flex flex-col">
          <TooltipProvider delayDuration={isSidebarOpen ? 700 : 0}>
            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
              {navItems.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>
                      <Link
                        to={item.comingSoon ? "#" : item.href}
                        className={cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative",
                          isActive
                            ? "bg-primary text-primary-foreground shadow-md"
                            : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                        )}
                        onClick={(e) => {
                          if (item.comingSoon) {
                            e.preventDefault();
                          }
                        }}
                      >
                        <div className={cn(
                          "flex h-5 w-5 items-center justify-center",
                          isActive && "text-primary-foreground"
                        )}>
                          <item.icon className="h-5 w-5" />
                        </div>
                        {isSidebarOpen && (
                          <>
                            <span className="truncate flex-1">{item.title}</span>
                            {item.comingSoon && (
                              <span className="text-xs bg-secondary/20 text-secondary-foreground px-1.5 py-0.5 rounded-md">
                                Soon
                              </span>
                            )}
                          </>
                        )}
                      </Link>
                    </TooltipTrigger>
                    {(!isSidebarOpen || item.comingSoon) && (
                      <TooltipContent side="right" className="max-w-xs">
                        <div>
                          <p className="font-medium">{item.title}</p>
                          {item.description && (
                            <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                          )}
                          {item.comingSoon && (
                            <p className="text-xs mt-1 font-medium text-secondary">Coming Soon</p>
                          )}
                        </div>
                      </TooltipContent>
                    )}
                  </Tooltip>
                );
              })}
            </nav>
          </TooltipProvider>

          {/* Sidebar Footer */}
          <div className="px-4 pb-6 mt-auto border-t border-border/40 pt-6">
            <TooltipProvider delayDuration={isSidebarOpen ? 700 : 0}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full flex items-center gap-3 justify-start text-destructive hover:bg-destructive/10 hover:text-destructive rounded-xl",
                      !isSidebarOpen && "justify-center px-0"
                    )}
                    onClick={() => logout()}
                  >
                    <LogOut className="h-5 w-5" />
                    {isSidebarOpen && <span>Logout</span>}
                  </Button>
                </TooltipTrigger>
                {!isSidebarOpen && (
                  <TooltipContent side="right">
                    <p className="font-medium">Logout</p>
                    <p className="text-xs text-muted-foreground">Sign out of your account</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
            
            {isSidebarOpen && (
              <div className="mt-4 p-3 rounded-xl bg-muted/50 text-xs text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Traffic Jam Management</p>
                <p>Version 1.0.0</p>
                <p className="mt-1">© 2024 Traffic Systems</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className={cn(
        "transition-all duration-300 ease-in-out",
        isSidebarOpen ? "lg:pl-64" : "lg:pl-20"
      )}>
        <Header 
          onMenuClick={() => setIsMobileMenuOpen(true)} 
          isSidebarCollapsed={!isSidebarOpen}
          toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />
        <main className="p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
};