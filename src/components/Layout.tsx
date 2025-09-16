import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { SearchCommand } from "@/components/SearchCommand";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, Search, Bell, Settings } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSession } from "@/hooks/useSession";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import BottomNavigation from "@/components/BottomNavigation";

export const Layout = () => {
  const isMobile = useIsMobile();
  const { session, isSigningOut, signOut } = useSession();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const handleCloseSheet = () => setIsSheetOpen(false);
  const handleOpenSearch = () => setIsSearchOpen(true);
  
  const userInitials = session?.user?.email?.charAt(0).toUpperCase() || 'U';
  const userName = session?.user?.email?.split('@')[0] || 'Usuario';
  
  // Handle scroll effects for mobile header
  useEffect(() => {
    // Defensive check for window availability
    if (typeof window === 'undefined') {
      return;
    }
    
    const handleScroll = () => {
      if (typeof window !== 'undefined') {
        setScrolled(window.scrollY > 0);
      }
    };
    
    try {
      window.addEventListener('scroll', handleScroll);
      return () => {
        try {
          window.removeEventListener('scroll', handleScroll);
        } catch (error) {
          console.warn('Failed to remove scroll listener:', error);
        }
      };
    } catch (error) {
      console.warn('Failed to add scroll listener:', error);
    }
  }, []);

  return (
    <div className="flex min-h-screen bg-gradient-bg">
      {/* Search Command Dialog */}
      <SearchCommand 
        open={isSearchOpen} 
        onOpenChange={setIsSearchOpen} 
      />
      
      {isMobile ? (
        <>
          {/* Mobile Header */}
          <header className={cn(
            "fixed top-0 left-0 right-0 z-40 h-16 bg-background/80 backdrop-blur-md border-b transition-all duration-300",
            scrolled && "shadow-lg bg-background/95"
          )}>
            <div className="flex items-center justify-between h-full px-4">
              <div className="flex items-center gap-3">
                <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon-sm">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="p-0 w-64">
                    <Sidebar 
                      isMobile={true} 
                      onClose={handleCloseSheet} 
                      onOpenSearch={handleOpenSearch}
                    />
                  </SheetContent>
                </Sheet>
                
                <h1 className="font-bold text-lg bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  FreelanceFlow
                </h1>
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon-sm" 
                  className="relative"
                  onClick={handleOpenSearch}
                >
                  <Search className="h-4 w-4" />
                </Button>
                
                <Button variant="ghost" size="icon-sm" className="relative">
                  <Bell className="h-4 w-4" />
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full" />
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="" alt={userName} />
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
                          {userInitials}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="flex items-center justify-start gap-2 p-2">
                      <div className="flex flex-col space-y-1 leading-none">
                        <p className="font-medium">{userName}</p>
                        <p className="w-[200px] truncate text-sm text-muted-foreground">
                          {session?.user?.email}
                        </p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Settings className="mr-2 h-4 w-4" />
                      Configuración
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => signOut()}
                      disabled={isSigningOut}
                      className="text-destructive focus:text-destructive"
                    >
                      {isSigningOut ? "Cerrando sesión..." : "Cerrar sesión"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>
          
          {/* Mobile Main Content with bottom navigation spacing */}
          <main className="flex-1 pt-16 pb-20 min-h-screen">
            <div className="animate-fade-in">
              <Outlet />
            </div>
          </main>
          
          {/* Bottom Navigation for Mobile */}
          <BottomNavigation />
        </>
      ) : (
        <>
          {/* Desktop Layout */}
          <Sidebar onOpenSearch={handleOpenSearch} />
          <main className="flex-1 overflow-auto min-h-screen">
            <div className="animate-fade-in">
              <Outlet />
            </div>
          </main>
        </>
      )}
    </div>
  );
};