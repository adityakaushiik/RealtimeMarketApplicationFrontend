import { Link, useLocation } from "react-router-dom";
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
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    useSidebar,
} from "@/components/ui/sidebar"
import {
    User,
    ChevronRight,
} from "lucide-react"
import { ApiService } from "@/shared/services/apiService";
import { sidebarConfig, type SidebarItem } from "@/config/sidebarConfig";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
    DropdownMenuPortal,
} from "@/components/ui/dropdown-menu"

// Recursive component for nested dropdown items
const DropdownSubItems = ({ items }: { items: SidebarItem[] }) => {
    return (
        <>
            {items.map((item) => {
                if (item.items?.length) {
                    return (
                        <DropdownMenuSub key={item.title}>
                            <DropdownMenuSubTrigger>
                                <span>{item.title}</span>
                            </DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                                <DropdownMenuSubContent>
                                    <DropdownSubItems items={item.items} />
                                </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                        </DropdownMenuSub>
                    );
                }
                return (
                    <DropdownMenuItem key={item.title} asChild>
                        <Link to={item.url} className="w-full">
                            {item.title}
                        </Link>
                    </DropdownMenuItem>
                );
            })}
        </>
    );
};

// Regular submenu item for expanded sidebar
const SubMenuItem = ({ item }: { item: SidebarItem }) => {
    const location = useLocation();
    const isActive = location.pathname === item.url;

    if (item.items?.length) {
        return (
            <Collapsible asChild defaultOpen={false} className="group/sub-collapsible">
                <SidebarMenuSubItem>
                    <CollapsibleTrigger asChild>
                        <SidebarMenuSubButton className="justify-between cursor-pointer">
                            <span>{item.title}</span>
                            <ChevronRight className="h-4 w-4 transition-transform duration-200 group-data-[state=open]/sub-collapsible:rotate-90" />
                        </SidebarMenuSubButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <SidebarMenuSub>
                            {item.items.map((subItem) => (
                                <SubMenuItem key={subItem.title} item={subItem} />
                            ))}
                        </SidebarMenuSub>
                    </CollapsibleContent>
                </SidebarMenuSubItem>
            </Collapsible>
        )
    }

    return (
        <SidebarMenuSubItem>
            <SidebarMenuSubButton asChild isActive={isActive}>
                <Link to={item.url}>
                    <span>{item.title}</span>
                </Link>
            </SidebarMenuSubButton>
        </SidebarMenuSubItem>
    )
}

// Main menu item that handles both collapsed and expanded states
const MainMenuItem = ({ item }: { item: SidebarItem }) => {
    const { state } = useSidebar();
    const location = useLocation();
    const isCollapsed = state === "collapsed";
    const isActive = location.pathname === item.url ||
        (item.items && item.items.some(sub =>
            location.pathname === sub.url ||
            sub.items?.some(s => location.pathname === s.url)
        ));

    // For items without children - simple link
    if (!item.items?.length) {
        return (
            <SidebarMenuItem>
                <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    isActive={isActive}
                    className="hover:bg-accent/50 hover:text-accent-foreground transition-colors"
                >
                    <Link to={item.url}>
                        {item.icon && <item.icon className="h-4 w-4" />}
                        <span className="font-medium">{item.title}</span>
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
        );
    }

    // For items with children when sidebar is COLLAPSED - use dropdown
    if (isCollapsed) {
        return (
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            tooltip={item.title}
                            isActive={isActive}
                            className="hover:bg-accent/50 hover:text-accent-foreground transition-colors cursor-pointer"
                        >
                            {item.icon && <item.icon className="h-4 w-4" />}
                            <span className="font-medium">{item.title}</span>
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        side="right"
                        align="start"
                        className="min-w-[200px]"
                    >
                        <DropdownSubItems items={item.items} />
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        );
    }

    // For items with children when sidebar is EXPANDED - use collapsible
    return (
        <Collapsible asChild defaultOpen={false} className="group/collapsible">
            <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                        tooltip={item.title}
                        isActive={isActive}
                        className="hover:bg-accent/50 hover:text-accent-foreground data-[state=open]:bg-accent/50 transition-colors"
                    >
                        {item.icon && <item.icon className="h-4 w-4" />}
                        <span className="font-medium">{item.title}</span>
                        <ChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90 text-muted-foreground/50" />
                    </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <SidebarMenuSub className="border-l-border/50 ml-6 pl-0">
                        {item.items.map((subItem) => (
                            <SubMenuItem key={subItem.title} item={subItem} />
                        ))}
                    </SidebarMenuSub>
                </CollapsibleContent>
            </SidebarMenuItem>
        </Collapsible>
    );
};

export function AppSidebar() {
    const currentUser = ApiService.getCurrentUser();

    return (
        <Sidebar collapsible="icon" className="border-r border-border/50 shadow-xl bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <SidebarContent>

                <SidebarGroup>
                    <SidebarGroupLabel className="px-2 py-2 text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider group-data-[collapsible=icon]:hidden">
                        Application
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu className="gap-1 px-2 group-data-[collapsible=icon]:px-0">
                            {sidebarConfig
                                .filter(item => !item.roles || (currentUser && currentUser.role_id && item.roles.includes(currentUser.role_id)))
                                .map((item) => (
                                    <MainMenuItem key={item.title} item={item} />
                                ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="border-t border-border/50 p-2">
                <SidebarMenu>
                    {currentUser && (
                        <SidebarMenuItem>
                            <div className="flex items-center gap-3 rounded-md bg-accent/20 p-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:bg-transparent group-data-[collapsible=icon]:p-0 transition-all">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                                    <User className="h-4 w-4" />
                                </div>
                                <div className="flex flex-col gap-0.5 overflow-hidden group-data-[collapsible=icon]:hidden">
                                    <span className="truncate text-sm font-medium">User</span>
                                    <span className="truncate text-xs text-muted-foreground">{currentUser.email}</span>
                                </div>
                            </div>
                        </SidebarMenuItem>
                    )}
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    )
}
