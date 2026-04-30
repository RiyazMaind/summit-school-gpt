import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, LayoutDashboard, GraduationCap, Users, LogOut, Menu, X, ChevronDown, CalendarDays, TrendingUp, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCurrentSchool } from "@/config/schools";

interface AppLayoutProps {
  children: React.ReactNode;
  role: "student" | "teacher" | "admin";
}

const roleConfig = {
  student: {
    label: "Student",
    icon: GraduationCap,
    navItems: [
      { path: "/student", label: "Dashboard", icon: LayoutDashboard },
      { path: "/student/explore", label: "Explore Topics", icon: BookOpen },
    ],
  },
  teacher: {
    label: "Teacher",
    icon: Users,
    navItems: [
      { path: "/teacher", label: "Dashboard", icon: LayoutDashboard },
      { path: "/teacher/quiz", label: "Create Quiz", icon: BookOpen },
      { path: "/teacher/attendance", label: "Attendance", icon: CalendarDays },
      { path: "/teacher/analytics", label: "Analytics", icon: TrendingUp },
    ],
  },
  admin: {
    label: "Admin",
    icon: LayoutDashboard,
    navItems: [
      { path: "/admin", label: "Dashboard", icon: LayoutDashboard },
      { path: "/admin/attendance-analytics", label: "Attendance Analytics", icon: BarChart3 },
    ],
  },
};

export default function AppLayout({ children, role }: AppLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const config = roleConfig[role];
  const RoleIcon = config.icon;
  const school = getCurrentSchool();

  return (
    <div className="min-h-screen bg-background">
      {/* Top nav */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-white/70 backdrop-blur-xl shadow-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-3">
            {/* School Logo */}
            <img
              src={school.logo}
              alt={school.name}
              className="h-10 w-10 rounded-full object-cover border border-gray-200 shadow-sm"
            />

            {/* Text */}
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold text-foreground">
                {school.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {school.subtitle}
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-1 md:flex">
            {config.navItems.map((item) => {
              const Icon = item.icon;
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`nav-link flex items-center gap-2 ${active ? "active" : "text-muted-foreground"}`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-sm md:flex">
              <RoleIcon className="h-4 w-4 text-secondary" />
              <span className="font-medium text-muted-foreground">{config.label}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
              className="text-muted-foreground"
            >
              <LogOut className="h-4 w-4" />
            </Button>
            <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.nav
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-border md:hidden"
            >
              <div className="space-y-1 p-4">
                {config.navItems.map((item) => {
                  const Icon = item.icon;
                  const active = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileOpen(false)}
                      className={`nav-link flex items-center gap-2 ${active ? "active" : "text-muted-foreground"}`}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}
