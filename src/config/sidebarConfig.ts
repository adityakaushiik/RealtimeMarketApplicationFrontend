import {
    LayoutDashboard,
    LineChart,
    Settings,
    type LucideIcon,
    PieChart,
    UserCog,
    MessageSquare,
    Activity
} from "lucide-react"
import { UserRoles } from "@/shared/utils/CommonConstants";

export interface SidebarItem {
    title: string;
    url: string;
    icon?: LucideIcon;
    items?: SidebarItem[];
    roles?: number[];
}

export const sidebarConfig: SidebarItem[] = [
    {
        title: "Dashboard",
        url: "/dashboard",
        icon: LayoutDashboard,
    },
    // {
    //     title: "Market",
    //     url: "#", // Placeholder parent
    //     icon: LineChart,
    //     items: [
    //         {
    //             title: "Stock Search",
    //             url: "/stocks",
    //         },
    //         {
    //             title: "Market Overview", // Placeholder
    //             url: "/market/overview",
    //         }
    //     ]
    // },
    {
        icon: LineChart,
        title: "Stock Search",
        url: "/stocks",
    },
    {
        title: "Watchlist",
        url: "/watchlist",
        icon: PieChart, // Using PieChart as placeholder icon or import another one
    },
    {
        title: "User Management",
        url: "/user-approval",
        icon: UserCog,
        roles: [UserRoles.ADMIN],
    },
    {
        title: "User Suggestions",
        url: "/user-suggestions",
        icon: MessageSquare,
        roles: [UserRoles.ADMIN],
    },
    {
        title: "Recording",
        url: "/recording-instruments",
        icon: Activity,
        roles: [UserRoles.ADMIN],
    },
    {
        title: "Configuration",
        url: "#",
        icon: Settings,
        roles: [UserRoles.ADMIN],
        items: [
            {
                title: "Instruments",
                url: "#",
                items: [
                    { title: "Create New", url: "/config/instruments/create" },
                    { title: "Update Existing", url: "/config/instruments/update" },
                    { title: "Delete", url: "/config/instruments/delete" },
                ]
            },
            {
                title: "Exchange Holidays",
                url: "#",
                items: [
                    { title: "Create New", url: "/config/exchange-holidays/create" },
                    { title: "Update Existing", url: "/config/exchange-holidays/update" },
                    { title: "Delete", url: "/config/exchange-holidays/delete" },
                ]
            },
            {
                title: "Exchanges",
                url: "#",
                items: [
                    { title: "Create New", url: "/config/exchanges/create" },
                    { title: "Update Existing", url: "/config/exchanges/update" },
                    { title: "Delete", url: "/config/exchanges/delete" },
                ]
            },
            {
                title: "Exchange Providers",
                url: "#",
                items: [
                    { title: "Add Provider", url: "/config/exchange-providers/create" },
                    { title: "Update Mapping", url: "/config/exchange-providers/update" },
                    { title: "Remove Provider", url: "/config/exchange-providers/delete" },
                ]
            },
            {
                title: "Providers",
                url: "#",
                items: [
                    { title: "Create New", url: "/config/providers/create" },
                    { title: "Update Existing", url: "/config/providers/update" },
                    { title: "Delete", url: "/config/providers/delete" },
                ]
            },
            {
                title: "Sectors",
                url: "#",
                items: [
                    { title: "Create New", url: "/config/sectors/create" },
                    { title: "Update Existing", url: "/config/sectors/update" },
                    { title: "Delete", url: "/config/sectors/delete" },
                ]
            },
            {
                title: "Instrument Types",
                url: "#",
                items: [
                    { title: "Create New", url: "/config/instrument-types/create" },
                    { title: "Update Existing", url: "/config/instrument-types/update" },
                    { title: "Delete", url: "/config/instrument-types/delete" },
                ]
            },
            {
                title: "Suggestion Types",
                url: "#",
                items: [
                    { title: "Create New", url: "/config/suggestion-types/create" },
                    { title: "Update Existing", url: "/config/suggestion-types/update" },
                    { title: "Delete", url: "/config/suggestion-types/delete" },
                ]
            },
        ],
    },
]
