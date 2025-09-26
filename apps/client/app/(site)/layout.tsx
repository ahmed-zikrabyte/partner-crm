/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { ChevronLeft, LogOut, User } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import type React from "react";
import { useEffect, useState } from "react";
import ConfirmationModal from "@/components/global/confirmation-modal";
import { AppSidebar } from "@/components/global/app-sidebar";
import { Button } from "@workspace/ui/components/button";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@workspace/ui/components/sidebar";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  // const lastSegment = pathname.split("/").pop();

  // const showBackButton =
  //   lastSegment === "create" ||
  //   lastSegment === "edit" ||
  //   lastSegment === "view";
  const segments = pathname.split("/").filter(Boolean);

  // ✅ exact match
  const showBackButton =
    segments.includes("create") ||
    segments.includes("edit") ||
    segments.includes("view");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const userType = localStorage.getItem("userType");
      const token = userType === "employee" 
        ? localStorage.getItem("employeeToken")
        : localStorage.getItem("partnerToken");
      if (!token) {
        router.replace("/login");
      } else {
        setIsAuthenticated(true);
      }
    }
  }, [router]);

  if (isAuthenticated === null) {
    return null; // Or a loader if you prefer
  }

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="flex flex-col flex-1 min-w-0">
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <div className="flex items-center justify-between w-full min-w-0">
              <SidebarTrigger className="-ml-1" />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="bg-white shadow-sm rounded-lg p-2 cursor-pointer">
                    <User />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem
                    onSelect={(e:any) => {
                      e.preventDefault();
                      setOpen(true);
                    }}
                    className="cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <main className="flex-1 overflow-auto">
            <div className="p-4 w-full max-w-full">
              {showBackButton && (
                <Button
                  onClick={() => router.back()}
                  variant="outline"
                  className="mb-4 cursor-pointer"
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              )}
              <div className="w-full max-w-full overflow-hidden">
                {children}
              </div>
            </div>
          </main>
        </SidebarInset>
      </SidebarProvider>

      <ConfirmationModal
        open={open}
        onOpenChange={setOpen}
        title="Logout"
        description="Are you sure you want to logout?"
        type="warning"
        confirmText="Logout"
        cancelText="Cancel"
        onConfirm={() => {
          localStorage.removeItem("partnerToken");
          localStorage.removeItem("employeeToken");
          localStorage.removeItem("userType");
          router.push("/login");
        }}
      />
    </div>
  );
}
