import type * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
	return (
		<input
			type={type}
			data-slot="input"
			className={cn(
				"flex h-11 w-full rounded-lg border-2 border-muted-foreground/5 bg-foreground/5 px-4 py-2 text-base font-medium text-foreground shadow-xs outline-none transition-all duration-300 placeholder:text-foreground/50 focus-visible:border-ring/20 focus-visible:ring-[3px] focus-visible:ring-offset-0 focus-visible:ring-offset-background focus-visible:ring-ring/15 hover:border-muted-foreground/10 hover:bg-muted-foreground/5 disabled:pointer-events-none disabled:opacity-50 selection:bg-primary selection:text-primary-foreground dark:bg-input/30",
				"aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
				className,
			)}
			{...props}
		/>
	);
}

export { Input };
