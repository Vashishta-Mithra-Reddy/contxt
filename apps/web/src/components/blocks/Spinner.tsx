"use client";
import { motion } from "framer-motion";

export default function Spinner() {
	return (
		<div className="wrapperx flex h-full items-center justify-center">
			<motion.svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 375 375"
				className="h-16 w-16"
				role="img"
				aria-label="Loading"
				fill="#545454"
				style={{ transformBox: "fill-box", transformOrigin: "center" }}
				initial={{ scale: 0.5, opacity: 0, rotate: 0 }}
				animate={{ scale: 1, opacity: 1, rotate: 360 }}
				exit={{ scale: 0, opacity: 0, rotate: 0 }}
				transition={{
					scale: { duration: 0.5, ease: "easeOut" },
					opacity: { duration: 0.5, ease: "easeOut" },
					rotate: {
						duration: 4,
						ease: "backOut",
						repeat: Number.POSITIVE_INFINITY,
					},
				}}
			>
				<rect x="176.5" y="59.5" width="22" height="72" rx="9" ry="9" />
				<rect
					x="176.5"
					y="59.5"
					width="22"
					height="72"
					rx="9"
					ry="9"
					transform="rotate(40 187.5 187.5)"
				/>
				<rect
					x="176.5"
					y="59.5"
					width="22"
					height="72"
					rx="9"
					ry="9"
					transform="rotate(80 187.5 187.5)"
				/>
				<rect
					x="176.5"
					y="59.5"
					width="22"
					height="72"
					rx="9"
					ry="9"
					transform="rotate(120 187.5 187.5)"
				/>
				<rect
					x="176.5"
					y="59.5"
					width="22"
					height="72"
					rx="9"
					ry="9"
					transform="rotate(160 187.5 187.5)"
				/>
				<rect
					x="176.5"
					y="59.5"
					width="22"
					height="72"
					rx="9"
					ry="9"
					transform="rotate(200 187.5 187.5)"
				/>
				<rect
					x="176.5"
					y="59.5"
					width="22"
					height="72"
					rx="9"
					ry="9"
					transform="rotate(240 187.5 187.5)"
				/>
				<rect
					x="176.5"
					y="59.5"
					width="22"
					height="72"
					rx="9"
					ry="9"
					transform="rotate(280 187.5 187.5)"
				/>
				<rect
					x="176.5"
					y="59.5"
					width="22"
					height="72"
					rx="9"
					ry="9"
					transform="rotate(320 187.5 187.5)"
				/>
			</motion.svg>
		</div>
	);
}
