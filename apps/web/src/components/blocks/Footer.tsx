"use client";

import ModeToggle from "./mode-toggle";


export default function Footer() {
	return (
		<footer className="border-t-0 border-dashed px-4 pb-24 md:pb-6 pt-4 font-jakarta">
			<div className="flex-col-center">
				<ModeToggle/>
				<div className="max-w-7xl flex-col-center">
					<p className="text-muted-foreground/50 text-sm pb-2 text-center">
						Plug and play your knowledge bases, manage embeddings, and retrieve intelligence
              instantly.
					</p>
				</div>
			</div>
			<div className="container mx-auto flex flex-col items-center justify-center gap-4 text-center text-muted-foreground/50 text-sm">
				<p>&copy; {new Date().getFullYear()} <span className="font-nippo">contxt</span>. All rights reserved.</p>
			</div>
		</footer>
	);
}
