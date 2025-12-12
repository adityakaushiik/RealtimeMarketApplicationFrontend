import { useNavigate } from "react-router-dom";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
    LayoutDashboard,
    LineChart,
    Settings,
    LogOut,
    User,
} from "lucide-react"
import { Link } from "react-router-dom"
import { ApiService } from "@/shared/services/apiService";
import { Separator } from "@/components/ui/separator";

// Menu items.
const items = [
    {
        title: "Dashboard",
        url: "/dashboard",
        icon: LayoutDashboard,
    },
    {
        title: "Stocks",
        url: "/stocks",
        icon: LineChart,
    },
    {
        title: "Config",
        url: "/config",
        icon: Settings,
    },
]

export function AppSidebar() {
    const navigate = useNavigate();
    const currentUser = ApiService.getCurrentUser();

    const handleLogout = () => {
        ApiService.logout();
        navigate("/login");
    };

    return (
        <Sidebar collapsible="icon">
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Application</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild tooltip={item.title}>
                                        <Link to={item.url}>
                                            <item.icon />
                                            <span className="text-base">{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter>
                <Separator className="mb-2" />
                <SidebarMenu>
                    {currentUser && (
                        <SidebarMenuItem>
                            <div className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground">
                                <User className="h-4 w-4 shrink-0" />
                                <span className="truncate group-data-[collapsible=icon]:hidden">
                                    {currentUser.email}
                                </span>
                            </div>
                        </SidebarMenuItem>
                    )}
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={handleLogout} tooltip="Logout">
                            <LogOut />
                            <span className="text-base">Logout</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    )
}
