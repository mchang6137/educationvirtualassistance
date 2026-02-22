import { Home, MessageSquare, BookOpen, BarChart3, User, LogOut } from "lucide-react";
import { T } from "@/components/T";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";

const studentItems = [
  { title: "Home", url: "/", icon: Home },
  { title: "Live Chat", url: "/chat", icon: MessageSquare },
  { title: "Forum", url: "/forum", icon: BookOpen },
  { title: "Profile", url: "/profile", icon: User },
];

const instructorItems = [
  { title: "Home", url: "/", icon: Home },
  { title: "Live Chat", url: "/chat", icon: MessageSquare },
  { title: "Forum", url: "/forum", icon: BookOpen },
  { title: "Dashboard", url: "/instructor", icon: BarChart3 },
  { title: "Profile", url: "/profile", icon: User },
];

export function AppSidebar() {
  const { role, signOut } = useAuth();
  const navigate = useNavigate();
  const items = role === "instructor" ? instructorItems : studentItems;

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <Sidebar collapsible="icon">
      <div className="flex items-center gap-2 p-4 border-b border-sidebar-border">
        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
          E
        </div>
        <span className="font-bold text-lg text-sidebar-foreground group-data-[collapsible=icon]:hidden">EVA</span>
      </div>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end={item.url === "/"} activeClassName="bg-sidebar-accent text-primary font-medium">
                      <item.icon className="h-4 w-4" />
                      <span><T>{item.title}</T></span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleSignOut} className="text-muted-foreground hover:text-destructive">
              <LogOut className="h-4 w-4" />
              <span><T>Sign Out</T></span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
