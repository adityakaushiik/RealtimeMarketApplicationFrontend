import {
    LayoutDashboard,
    LineChart,
    Settings,
    type LucideIcon,
    PieChart,
} from "lucide-react"

export interface SidebarItem {
    title: string;
    url: string;
    icon?: LucideIcon;
    items?: SidebarItem[];
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
        title: "Configuration",
        url: "#",
        icon: Settings,
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
        ],
    },
]
