"use client";

import Link from "next/link";
// import { usePathname } from "next/navigation";
import { ModeToggle } from "./mode-toggle";
import UserMenu from "../auth/user-menu";
// import { authClient } from "@/lib/auth-client";
import * as React from "react";
import { motion, useScroll, useMotionValueEvent, useTransform } from "framer-motion";

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

	const { scrollY } = useScroll();
	const [scrolled, setScrolled] = React.useState(false);

	useMotionValueEvent(scrollY, "change", (latest) => {
		setScrolled(latest > 8);
	});

	// Smoothly round header to 2xl (~16px)
	const headerRadius = useTransform(scrollY, [0, 120], [10, 16]);
	// Animate container width from 7xl (1280px) to 5xl (1024px)
	const headerMaxWidth = useTransform(scrollY, [60, 120], [1280, 1152]);

	return (
		<motion.header
			className="w-full fixed top-0 md:top-6 left-1/2 -translate-x-1/2 z-40 backdrop-blur-3xl transition-all duration-700 bg-header"
			style={{ borderRadius: headerRadius, maxWidth: headerMaxWidth }}
		>
			{/* Color layer: transparent initially, fades in on scroll */}
			<motion.div
				className="absolute inset-0"
				style={{ borderRadius: "inherit" }}
				initial={{ opacity: 0 }}
				animate={{ opacity: scrolled ? 0.9 : 0 }}
				transition={{ duration: 0.25, ease: "easeOut" }}
			/>
			{/* Use bg via style to keep theme color without class flicker */}
			<motion.div
				className="absolute inset-0"
				style={{
					borderRadius: "inherit",
					backgroundColor: "var(--color-header)",
				}}
				initial={{ opacity: 0 }}
				animate={{ opacity: scrolled ? 1 : 0 }}
				transition={{ duration: 0.25, ease: "easeOut" }}
			/>

			<div className="relative w-full flex justify-between items-center px-3 py-3">
				{/* Logo / Home link */}
				<Link href="/" className="pl-2">
					<motion.span
						className="font-normal flex items-center justify-center text-3xl tracking-wide font-nippo text-foreground pl-2"
					>
						cont<span className="text-foreground/70">x</span>t
					</motion.span>
				</Link>

				{/* Theme + User Menu */}
				<div className="flex items-center gap-2 transition-all duration-0 font-nippo">
					<UserMenu />
				</div>
			</div>
		</motion.header>
	);
}
