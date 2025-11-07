"use client";

import Link from "next/link";
// import { usePathname } from "next/navigation";
import { ModeToggle } from "./mode-toggle";
import UserMenu from "../auth/user-menu";
// import { authClient } from "@/lib/auth-client";

export default function Header() {
	// const pathname = usePathname();
	// const { data: session } = authClient.useSession();

	// const isLoggedIn = !!session;
	// const isDashboard = pathname.startsWith("/dashboard");

	// const dashboardTabs = [
	// 	{ key: "overview", label: "Overview", path: { pathname: "/dashboard" } },
	// 	{
	// 		key: "food-log",
	// 		label: "Food Log",
	// 		path: { pathname: "/dashboard/food-log" },
	// 	},
	// 	{
	// 		key: "reflection",
	// 		label: "Daily Reflection",
	// 		path: { pathname: "/dashboard/reflection" },
	// 	},
	// 	{
	// 		key: "insights",
	// 		label: "Insights",
	// 		path: { pathname: "/dashboard/insights" },
	// 	},
	// 	{
	// 		key: "settings",
	// 		label: "Settings",
	// 		path: { pathname: "/dashboard/settings" },
	// 	},
	// ];

	return (
		<header
			// className={`border-b-0 px-6 md:px-12 py-4 font-outfit text-gray-600 dark:text-foreground ${isDashboard ? "border-b-2 border-border/20" : ""}`}
			className={`border-b-2 px-6 md:px-12 py-4 font-outfit text-gray-600 dark:text-foreground border-border/50`}
		>
			<div className="flex flex-row items-center justify-between">
				{/* Logo / Home link */}
				<Link
					href="/"
					className="font-medium font-outfit text-3xl dark:text-foreground pr-12"
				>
					contxt
				</Link>

				{/* Dashboard Navigation Tabs */}
				{/* {isLoggedIn && isDashboard && (
					<nav className="hidden md:flex items-center space-x-4 font-jakarta overflow-x-auto no-scrollbar">
						{dashboardTabs.map(({ key, label, path }) => {
							const isActive = pathname === path.pathname;
							return (
								<Link
									key={key}
									href={path}
									className={`relative px-6 py-2.5 text-sm font-medium rounded-lg transition-all duration-200
										${
											isActive
												? "text-foreground/80 bg-[#2e2e2e]/20 dark:bg-[#2e2e2e]"
												: "text-foreground/70 hover:text-foreground/80 hover:bg-[#2e2e2e]/10 dark:hover:bg-[#2e2e2e]/70"
										}`}
								>
									{label}
								</Link>
							);
						})}
					</nav>
				)} */}

				{/* Theme + User Menu */}
				<div className="flex items-center gap-2">
					<ModeToggle />
					<UserMenu />
				</div>
			</div>
		</header>
	);
}
