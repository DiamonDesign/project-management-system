import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

export const Layout = () => {
  const isMobile = useIsMobile();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const handleCloseSheet = () => setIsSheetOpen(false);

  return (
    <div className="flex min-h-screen bg-background">
      {isMobile ? (
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="fixed top-4 left-4 z-50">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <Sidebar isMobile={true} onClose={handleCloseSheet} />
          </SheetContent>
        </Sheet>
      ) : (
        <Sidebar />
      )}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};