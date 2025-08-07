import React from "react";
import { Shield, Users, FileText, BarChart3, Settings, ScrollText, Moon, Sun, UserCheck } from "lucide-react";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const adminMenuItems = [
  {
    title: "Visão Geral",
    icon: BarChart3,
    id: "overview",
  },
  {
    title: "Usuários",
    icon: Users,
    id: "users",
  },
  {
    title: "Moderadores",
    icon: UserCheck,
    id: "moderators",
  },
  {
    title: "Gerenciar Funções",
    icon: Shield,
    id: "roles",
  },
  {
    title: "Funções do Menu",
    icon: Settings,
    id: "menu-functions",
  },
  {
    title: "Conteúdo",
    icon: FileText,
    id: "content",
  },
  {
    title: "Tutoriais",
    icon: ScrollText,
    id: "tutorials",
  },
  {
    title: "Banners",
    icon: FileText,
    id: "banners",
  },
  {
    title: "Certificados",
    icon: Settings,
    id: "certificates",
  },
  {
    title: "Analytics",
    icon: BarChart3,
    id: "analytics",
  },
  {
    title: "Logs",
    icon: ScrollText,
    id: "logs",
  },
  {
    title: "Configurações",
    icon: Settings,
    id: "settings",
  },
];

export function AdminSidebar({ activeTab, onTabChange }: AdminSidebarProps) {
  const { state } = useSidebar();
  const { theme, toggleTheme } = useTheme();
  const collapsed = !state || state === "collapsed";

  return (
    <Sidebar className="bg-black border-r border-gray-800" collapsible="icon">
      <SidebarHeader className="border-b border-gray-800 p-4">
        <div className="flex items-center gap-3">
          {!collapsed && (
            <img 
              src="/lovable-uploads/01194843-44b5-470b-9611-9f7d44e46212.png"
              alt="Compuse Logo" 
              className="h-8"
            />
          )}
          {collapsed && (
            <Shield className="h-8 w-8 text-primary" />
          )}
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-white">Admin Panel</span>
              <span className="text-xs text-gray-400">Compuse</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-400 text-xs uppercase tracking-wider">
            {!collapsed && "Administração"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminMenuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton 
                    asChild
                    className={`
                      text-white hover:bg-gray-800 hover:text-primary transition-colors
                      ${activeTab === item.id ? 'bg-gray-800 text-primary' : ''}
                    `}
                  >
                    <button
                      onClick={() => onTabChange(item.id)}
                      className="w-full flex items-center gap-3 p-2"
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-gray-800 p-4">
        <div className="space-y-2">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size={collapsed ? "icon" : "sm"}
            onClick={toggleTheme}
            className="text-white hover:bg-gray-800 hover:text-primary w-full justify-start"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
            {!collapsed && (
              <span className="ml-2">
                {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
              </span>
            )}
          </Button>
          
          {/* Version */}
          {!collapsed && (
            <p className="text-xs text-gray-400 text-center">Compuse Admin v1.0</p>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}