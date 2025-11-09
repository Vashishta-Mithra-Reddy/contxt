"use client";

import ModeToggle from "./mode-toggle";

// import dynamic from "next/dynamic";

// Dynamically import LiquidMetal to prevent SSR issues
// const LiquidMetal = dynamic(
// 	() =>
// 		import("@paper-design/shaders-react").then((mod) => ({
// 			default: mod.LiquidMetal,
// 		})),
// 	{ ssr: false },
// );

export default function Footer() {
	return (
		<footer className="border-t-0 border-dashed px-4 pb-24 md:pb-6 pt-4 font-jakarta">
			<div className="flex-col-center">
				<ModeToggle/>
				<div className="max-w-7xl flex-col-center">
					{/* <LiquidMetal
						width={200}
						height={80}
						image="/ahara_logo.svg"
						colorBack="#00000000"
						colorTint="#616161"
						shape={undefined}
						repetition={1.5}
						softness={0.45}
						shiftRed={0}
						shiftBlue={0}
						distortion={0}
						contour={0}
						angle={90}
						speed={0.64}
						scale={1}
						fit="contain"
					/> */}
					<p className="text-muted-foreground/50 text-sm pb-2">
						Plug and play with RAG.
					</p>
				</div>
			</div>
			{/* <div className="container mx-auto flex flex-col items-center justify-center gap-4 text-center text-muted-foreground/50 text-sm">
				<p>&copy; {new Date().getFullYear()} Ahara. All rights reserved.</p>
			</div> */}
		</footer>
	);
}
