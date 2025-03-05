
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Building2, 
  BarChart3, 
  Menu, 
  X, 
  Search, 
  LogOut,
  UserCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function Navbar() {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const renderAvatarFallback = () => {
    if (profile?.full_name) {
      const initials = profile.full_name.split(' ')
        .map((name: string) => name[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
      return initials;
    }
    return user?.email?.substring(0, 2).toUpperCase() || 'U';
  };

  return (
    <div className="lg:flex lg:items-center">
      <div className="lg:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-white">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-64">
            <div className="flex flex-col gap-4 mt-6">
              <Link 
                to="/real-estate-pipeline" 
                className="flex items-center gap-2 py-2 text-primary hover:underline"
                onClick={closeMenu}
              >
                <Building2 className="h-5 w-5" />
                <span>Real Estate Pipeline</span>
              </Link>
              <Link 
                to="/salesforce-leads" 
                className="flex items-center gap-2 py-2 text-primary hover:underline"
                onClick={closeMenu}
              >
                <BarChart3 className="h-5 w-5" />
                <span>Salesforce Dashboard</span>
              </Link>
              <Link 
                to="/find-contacts" 
                className="flex items-center gap-2 py-2 text-primary hover:underline"
                onClick={closeMenu}
              >
                <Search className="h-5 w-5" />
                <span>Find Contacts</span>
              </Link>

              {user && (
                <>
                  <div className="my-2 border-t pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={profile?.avatar_url || undefined} />
                        <AvatarFallback>{renderAvatarFallback()}</AvatarFallback>
                      </Avatar>
                      <div className="text-sm">
                        <div className="font-medium">{profile?.full_name || user.email}</div>
                        {profile?.full_name && <div className="text-muted-foreground text-xs">{user.email}</div>}
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start" 
                      onClick={handleSignOut}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="hidden lg:flex lg:items-center lg:gap-6">
        <nav className="flex items-center space-x-4 lg:space-x-6">
          <Link
            to="/real-estate-pipeline"
            className="text-sm font-medium text-white hover:text-white/80 transition-colors"
          >
            Real Estate Pipeline
          </Link>
          <Link
            to="/salesforce-leads"
            className="text-sm font-medium text-white hover:text-white/80 transition-colors"
          >
            Salesforce Dashboard
          </Link>
          <Link
            to="/find-contacts"
            className="text-sm font-medium text-white hover:text-white/80 transition-colors"
          >
            Find Contacts
          </Link>
        </nav>

        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative p-0" size="icon">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile?.avatar_url || undefined} />
                  <AvatarFallback>{renderAvatarFallback()}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <div className="px-2 py-1.5">
                <div className="font-medium">{profile?.full_name || 'User'}</div>
                <div className="text-xs text-muted-foreground">{user.email}</div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
