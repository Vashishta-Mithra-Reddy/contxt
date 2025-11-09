"use client";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

export default function AuthButton({ className }: { className?: string }) {
	const { data: session, isPending } = authClient.useSession();

	if (isPending) {
		return (
			<div className="flex animate-pulse items-center gap-2 rounded-xl bg-foreground/5 px-4 py-3">
				<div className="size-4 rounded-full bg-foreground/20" />
				<div className="h-4 w-16 rounded bg-foreground/20" />
			</div>
		);
	}

	if (!session) {
		return (
			<Link
				href="/login"
				className={`flex cursor-pointer items-center gap-2 rounded-xl border-2 border-white/40 px-6 py-3 text-center text-white transition-all duration-300 hover:bg-white/20 hover:text-white/90 font-jakarta ${className || ""}`}
			>
				{/* <span className="font-medium text-base">Get Started</span> */}
				Get Started
			</Link>
		);
	}

	return (
		<Link
			href={"/dashboard"}
			className={`flex cursor-pointer items-center gap-2 rounded-xl border-2 border-white/40 px-6 py-3 text-center text-white transition-all duration-500 hover:bg-white/20 hover:text-white/90 font-jakarta ${className || ""}`}
		>
			{/* <span className="font-medium text-base"> */}
				Go to Dashboard
			{/* </span> */}
		</Link>
	);
}
