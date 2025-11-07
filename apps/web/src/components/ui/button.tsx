import { cva, type VariantProps } from "class-variance-authority";
import { Slot as SlotPrimitive } from "radix-ui";
import type * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
	"relative z-10 flex shrink-0 items-center justify-center gap-2 rounded-xl bg-foreground/20 px-6 py-1.5 text-base font-medium text-foreground transition-all duration-500 cursor-pointer focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:border-ring hover:bg-foreground/5 hover:text-foreground/90 disabled:pointer-events-none disabled:opacity-50 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
	{
		variants: {
			variant: {
				default:
					"bg-[#2b2b2b] text-[#fff] border-foreground/10 hover:bg-[#2b2b2b]/90 hover:text-white/90 font-bold",
				destructive:
					"border-destructive bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:text-white",
				outline:
					"border border-foreground/30 bg-background hover:bg-foreground/10",
				secondary:
					"bg-secondary text-secondary-foreground hover:bg-secondary/80",
				ghost: "bg-transparent hover:bg-foreground/10 hover:text-foreground",
				link: "text-primary underline-offset-4 hover:underline hover:text-primary/90 border-none bg-transparent hover:bg-transparent hover:translate-y-0",
			},
			size: {
				default: "h-auto px-6 py-3",
				sm: "h-auto px-4 py-2 text-sm",
				lg: "h-auto px-8 py-4 text-lg",
				icon: "size-10 p-0 justify-center",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

function Button({
	className,
	variant,
	size,
	asChild = false,
	...props
}: React.ComponentProps<"button"> &
	VariantProps<typeof buttonVariants> & {
		asChild?: boolean;
	}) {
	const Comp = asChild ? SlotPrimitive.Slot : "button";
	return (
		<Comp
			data-slot="button"
			className={cn(buttonVariants({ variant, size, className }))}
			{...props}
		/>
	);
}

export { Button, buttonVariants };
