import { LayoutDashboard, LogOut, LucideForkKnifeCrossed, SunMoon, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth-client";

export default function UserMenu({ className }: { className?: string }) {
	const router = useRouter();
	const { data: session, isPending } = authClient.useSession();

	if (isPending) {
		return (
			<div className="flex animate-pulse items-center gap-2 rounded-xl bg-foreground/5 px-6.5 py-3">
				{/* <div className="size-4 rounded-full bg-foreground/20" /> */}
				<div className="h-6 w-12 rounded border-2 border-transparent bg-foreground/5" />
			</div>
		);
	}

	if (!session) {
		return (
			<div className="relative inline-block">
				{/* <div className="absolute inset-0 rounded-xl bg-foreground/10 shadow-lg transition-all duration-500" aria-hidden="true" /> */}
				<Link
					href="/login"
					className={`hover:-translate-y-0.5 active:translate-0 relative z-10 flex cursor-pointer items-center gap-2 rounded-xl border-2 border-foreground/20 bg-background px-6 py-3 text-center transition-all duration-500 hover:bg-foreground/5 hover:text-foreground/90 ${className || ""}`}
				>
					{/* <User className="size-4" /> */}
					<span className="font-medium text-base">Sign In</span>
				</Link>
			</div>
		);
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<div className="flex cursor-pointer items-center gap-2 rounded-xl px-4 py-3.5 border-2 border-foreground/20 text-center transition-all duration-300 hover:bg-foreground/5 hover:text-foreground/90">
					{session.user.image ? (
						<img
							src={session.user.image}
							alt={session.user.name}
							className="size-4 rounded-full"
						/>
					) : (
						<User className="size-4" />
					)}
					<span className="max-w-24 truncate font-medium text-sm">
						{session.user.name}
					</span>
				</div>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				className="w-56 border-2 border-foreground/10 dark:border-foreground/10 bg-card font-nippo"
				align="end"
			>
				<DropdownMenuLabel className="font-normal">
					<div className="flex flex-col space-y-1">
						<p className="font-medium text-sm leading-none line-clamp-1 text-foreground/90">
							{session.user.name}
						</p>
						<p className="truncate text-muted-foreground text-xs leading-none line-clamp-1">
							{session.user.email}
						</p>
					</div>
				</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuItem className="cursor-pointer text-foreground/90 focus:text-foreground">
					<LayoutDashboard className="size-4" />
					<Link href="/dashboard">Dashboard</Link>
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					className="cursor-pointer text-destructive focus:text-destructive"
					onClick={() => {
						authClient.signOut({
							fetchOptions: {
								onSuccess: () => {
									router.push("/");
								},
							},
						});
					}}
				>
					<LogOut className="size-4 text-destructive" />
					<span>Sign Out</span>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
