import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  LayoutDashboard,
  Wrench,
  ClipboardList,
  Users,
  Settings,
  Settings2,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  Calendar,
  ChevronDown,
  Factory,
  Tag,
  FileText
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface LayoutShellProps {
  children: ReactNode;
}

export function LayoutShell({ children }: LayoutShellProps) {
  const [location, setLocation] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [equipmentOpen, setEquipmentOpen] = useState(false);

  // Fallback if not logged in (should be handled by router guards, but defensive coding)
  if (!user) return null;

  const isEquipmentActive = location.startsWith("/equipment") || location.startsWith("/work-centers") || location.startsWith("/categories");

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:block shadow-2xl",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-full flex flex-col">
          {/* Logo Area */}
          <div className="h-16 flex items-center px-6 border-b border-slate-800">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center mr-3 shadow-[0_0_15px_rgba(59,130,246,0.5)]">
              <Wrench className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-display font-bold tracking-tight">GearGuard</span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            {/* Dashboard */}
            <Link href="/">
              <div className={cn(
                "flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 cursor-pointer group",
                location === "/" ? "bg-primary text-white shadow-lg shadow-primary/25" : "text-slate-400 hover:bg-slate-800 hover:text-white"
              )}>
                <LayoutDashboard className={cn("mr-3 h-5 w-5 flex-shrink-0", location === "/" ? "text-white" : "text-slate-500 group-hover:text-white")} />
                Dashboard
              </div>
            </Link>

            {/* Calendar */}
            {(user.role === "admin" || user.role === "technician") && (
              <Link href="/calendar">
                <div className={cn(
                  "flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 cursor-pointer group",
                  location.startsWith("/calendar") ? "bg-primary text-white shadow-lg shadow-primary/25" : "text-slate-400 hover:bg-slate-800 hover:text-white"
                )}>
                  <Calendar className={cn("mr-3 h-5 w-5 flex-shrink-0", location.startsWith("/calendar") ? "text-white" : "text-slate-500 group-hover:text-white")} />
                  Calendar
                </div>
              </Link>
            )}

            {/* Equipment Dropdown */}
            {(user.role === "admin" || user.role === "employee") && (
              <div className="space-y-1">
                <button
                  onClick={() => setEquipmentOpen(!equipmentOpen)}
                  className={cn(
                    "w-full flex items-center justify-between px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 cursor-pointer group",
                    isEquipmentActive ? "bg-primary text-white shadow-lg shadow-primary/25" : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  )}
                >
                  <span className="flex items-center">
                    <Wrench className={cn("mr-3 h-5 w-5 flex-shrink-0", isEquipmentActive ? "text-white" : "text-slate-500 group-hover:text-white")} />
                    Equipment
                  </span>
                  <ChevronDown className={cn("h-4 w-4 transition-transform", equipmentOpen ? "rotate-180" : "")} />
                </button>
                {equipmentOpen && (
                  <div className="ml-4 pl-4 border-l border-slate-700 space-y-1">
                    <Link href="/work-centers">
                      <div className={cn(
                        "flex items-center px-4 py-2 text-sm rounded-lg cursor-pointer",
                        location.startsWith("/work-centers") ? "text-white bg-slate-800" : "text-slate-400 hover:text-white hover:bg-slate-800"
                      )}>
                        <Factory className="mr-2 h-4 w-4" /> Work Centers
                      </div>
                    </Link>
                    <Link href="/equipment">
                      <div className={cn(
                        "flex items-center px-4 py-2 text-sm rounded-lg cursor-pointer",
                        location.startsWith("/equipment") ? "text-white bg-slate-800" : "text-slate-400 hover:text-white hover:bg-slate-800"
                      )}>
                        <Wrench className="mr-2 h-4 w-4" /> Machine & Tools
                      </div>
                    </Link>
                    {user.role === "admin" && (
                      <Link href="/categories">
                        <div className={cn(
                          "flex items-center px-4 py-2 text-sm rounded-lg cursor-pointer",
                          location.startsWith("/categories") ? "text-white bg-slate-800" : "text-slate-400 hover:text-white hover:bg-slate-800"
                        )}>
                          <Tag className="mr-2 h-4 w-4" /> Categories
                        </div>
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Reporting (Requests) */}
            <Link href="/requests">
              <div className={cn(
                "flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 cursor-pointer group",
                location.startsWith("/requests") ? "bg-primary text-white shadow-lg shadow-primary/25" : "text-slate-400 hover:bg-slate-800 hover:text-white"
              )}>
                <FileText className={cn("mr-3 h-5 w-5 flex-shrink-0", location.startsWith("/requests") ? "text-white" : "text-slate-500 group-hover:text-white")} />
                Reporting
              </div>
            </Link>

            {/* Teams */}
            {user.role === "admin" && (
              <Link href="/teams">
                <div className={cn(
                  "flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 cursor-pointer group",
                  location.startsWith("/teams") ? "bg-primary text-white shadow-lg shadow-primary/25" : "text-slate-400 hover:bg-slate-800 hover:text-white"
                )}>
                  <Users className={cn("mr-3 h-5 w-5 flex-shrink-0", location.startsWith("/teams") ? "text-white" : "text-slate-500 group-hover:text-white")} />
                  Teams
                </div>
              </Link>
            )}

            {/* Users */}
            {user.role === "admin" && (
              <Link href="/users">
                <div className={cn(
                  "flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 cursor-pointer group",
                  location.startsWith("/users") ? "bg-primary text-white shadow-lg shadow-primary/25" : "text-slate-400 hover:bg-slate-800 hover:text-white"
                )}>
                  <Users className={cn("mr-3 h-5 w-5 flex-shrink-0", location.startsWith("/users") ? "text-white" : "text-slate-500 group-hover:text-white")} />
                  Users
                </div>
              </Link>
            )}
          </nav>


          {/* User Profile Footer */}
          <div className="p-4 border-t border-slate-800">
            <Link href="/profile">
              <div className="flex items-center gap-3 px-2 py-2 cursor-pointer hover:bg-slate-800 rounded-lg transition-colors group">
                <Avatar className="h-9 w-9 border border-slate-700">
                  <AvatarImage src={user.avatarUrl || undefined} />
                  <AvatarFallback className="bg-slate-800 text-slate-200 group-hover:bg-slate-700 transition-colors">
                    {user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{user.name}</p>
                  <p className="text-xs text-slate-500 truncate capitalize group-hover:text-slate-400 transition-colors">{user.role}</p>
                </div>
                <div onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  logoutMutation.mutate();
                }} role="button" className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md transition-colors">
                  <LogOut className="h-4 w-4" />
                </div>
              </div>
            </Link>
          </div>

        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-border/60 flex items-center justify-between px-4 lg:px-8">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden mr-4"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </Button>

            {/* Global Search Bar (Visual Only) */}
            <div className="hidden md:flex items-center relative max-w-md w-64 lg:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search equipment, requests..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative text-muted-foreground">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 border-2 border-white"></span>
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-gray-50/50 p-4 md:p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
