"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@workspace/ui/components/sidebar";
import {
  ChevronRight,
  Users,
  Building2,
  ShoppingCart,
  Clock,
  Smartphone,
  User,
} from "lucide-react";
import { cn } from "@workspace/ui/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import { useSidebar } from "@workspace/ui/components/sidebar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog";

export function AppSidebar() {
  const pathname = usePathname();
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [userType, setUserType] = useState<string | null>(null);
  const { isMobile, setOpenMobile } = useSidebar();

  // Get userType from localStorage on mount
  useEffect(() => {
    const storedUserType = localStorage.getItem("userType");
    setUserType(storedUserType);
  }, []);

  // Responsive behavior
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768 && !isMobile) {
        setOpenMobile(false);
      }
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, [isMobile, setOpenMobile]);

  const handleLogout = () => {
    localStorage.removeItem("partnerToken");
    localStorage.removeItem("employeeToken");
    localStorage.removeItem("userType");
    window.location.href = "/login";
  };

  const handleNavigation = () => {
    if (isMobile) setOpenMobile(false);
  };

  // User type-based navigation items
  const getFilteredNavigationItems = (userType: string | null) => {
    if (userType === "partner") {
      return [
        { title: "Company", url: "/company", icon: Building2 },
        { title: "Vendor", url: "/vendor", icon: ShoppingCart },
        { title: "Employee", url: "/employee", icon: Users },
        { title: "Device", url: "/device", icon: Smartphone },
        { title: "Attendance", url: "/attendance", icon: Clock },
        // { title: "Cashbook", url: "/cashbook", icon: Clock },
        { title: "Profile", url: "/profile", icon: User },
      ];
    }
    if (userType === "employee") {
      return [
        { title: "Device", url: "/device", icon: Smartphone },
        { title: "Profile", url: "/profile", icon: User },
      ];
    }
    return [];
  };

  const filteredItems = getFilteredNavigationItems(userType);

  return (
    <TooltipProvider delayDuration={300}>
      <Sidebar
        collapsible="icon"
        className="border-border bg-gray h-screen max-w-full border-r shadow-sm"
      >
        <SidebarContent className="bg-gray flex h-full flex-col justify-between">
          {/* LOGO */}
          <SidebarGroup>
            <SidebarGroupLabel className="flex justify-center border-b border-gray-100 p-5">
              <div className="flex items-center space-x-2">
                <Building2 className="h-8 w-8 text-primary" />
                <span className="text-lg font-bold text-primary">
                  {userType === "employee" ? "Employee CRM" : "Partner CRM"}
                </span>
              </div>
            </SidebarGroupLabel>

            {/* MENU */}
            <SidebarGroupContent className=" mt-2">
              {filteredItems.length > 0 ? (
                <SidebarMenu>
                  {filteredItems.map((item) => {
                    const isActive =
                      pathname === item.url ||
                      pathname.startsWith(item.url + "/");
                    return (
                      <SidebarMenuItem key={item.title} className="mb-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <SidebarMenuButton
                              asChild
                              isActive={isActive}
                              className={cn(
                                "group relative flex items-center gap-3 rounded-lg px-4 py-3 transition-all",
                                isActive
                                  ? "bg-blue-50 font-medium dark:bg-gray-800"
                                  : "hover:bg-gray-50 dark:hover:bg-gray-800"
                              )}
                            >
                              <Link
                                href={item.url}
                                className="flex w-full items-center"
                                onClick={handleNavigation}
                              >
                                <div
                                  className={cn(
                                    "flex h-9 w-9 items-center justify-center rounded-md",
                                    isActive
                                      ? "bg-primary text-white"
                                      : "text-gray-700 dark:text-gray-300"
                                  )}
                                >
                                  <item.icon className="size-5" />
                                </div>
                                <span
                                  className={cn(
                                    "ml-3 flex-1 truncate text-base",
                                    isActive
                                      ? "text-primary"
                                      : "text-black dark:text-gray-200"
                                  )}
                                >
                                  {item.title}
                                </span>
                                <ChevronRight
                                  className={cn(
                                    "ml-auto h-4 w-4 transition-transform",
                                    isActive
                                      ? "text-primary rotate-90"
                                      : "text-gray-400 opacity-0 group-hover:opacity-100"
                                  )}
                                />
                              </Link>
                            </SidebarMenuButton>
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            <p>{item.title}</p>
                          </TooltipContent>
                        </Tooltip>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              ) : (
                <p className="text-center text-gray-500 mt-4">
                  No navigation items available.
                </p>
              )}
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      {/* LOGOUT CONFIRMATION DIALOG */}
      <AlertDialog
        open={isLogoutDialogOpen}
        onOpenChange={setIsLogoutDialogOpen}
      >
        <AlertDialogContent className="w-72 space-y-4 rounded-xl md:w-96">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to logout?
              <br />
              You will be redirected to the login page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              className="bg-primary hover:bg-primary"
            >
              Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>
  );
}
