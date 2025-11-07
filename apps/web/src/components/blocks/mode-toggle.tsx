"use client";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import * as React from "react";
import useSound from "use-sound";

export function ModeToggle() {
	const { setTheme, resolvedTheme } = useTheme();
	const [mounted, setMounted] = React.useState(false);
	const [click] = useSound("/click.wav", { volume: 0.2 });

	React.useEffect(() => {
		setMounted(true);
	}, []);

	const toggleTheme = () => {
		if (!mounted) return;
		setTheme(resolvedTheme === "light" ? "dark" : "light");
		click();
	};

	return (
		<div
			className={
				"relative flex cursor-pointer items-center gap-2 rounded-xl px-4 py-3.5 text-center text-foreground transition-all duration-300 hover:bg-foreground/5 hover:text-foreground/90 dark:text-muted-foreground"
			}
			onClick={toggleTheme}
		>
			{/* Icons render always, with fallback logic to avoid layout shift */}
			<Sun
				className={`size-6 transition-all ${
					mounted
						? "rotate-0 scale-100 dark:rotate-90 dark:scale-0"
						: "opacity-0"
				}`}
			/>
			<Moon
				className={`absolute size-6 transition-all ${
					mounted
						? "-rotate-90 scale-0 dark:rotate-0 dark:scale-100"
						: "opacity-0"
				}`}
			/>
		</div>
	);
}

export default ModeToggle;
