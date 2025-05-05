
import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { Sun, Moon, User, LogOut } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface HeaderProps {
  darkMode: boolean;
  toggleDarkMode: () => void;
}

export const Header: React.FC<HeaderProps> = ({ darkMode, toggleDarkMode }) => {
  const { user, logout } = useAuth();
  const { toast } = useToast();

  const handleLogout = () => {
    logout();
    toast({
      title: 'Logout realizado',
      description: 'Você saiu da sua conta com sucesso.',
    });
  };

  return (
    <header className="w-full py-4 px-6 flex items-center justify-between bg-background border-b">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
          SongScribe
        </h1>
      </div>

      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleDarkMode}
          aria-label={darkMode ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
        >
          {darkMode ? <Sun size={20} /> : <Moon size={20} />}
        </Button>

        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2">
                <User size={20} />
                <span className="hidden md:inline">{user.name}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="mr-2" size={16} />
                <span>Sair</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
};
