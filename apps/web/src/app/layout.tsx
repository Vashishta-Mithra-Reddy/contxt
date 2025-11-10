import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "../index.css";
import Providers from "@/components/providers/providers";
import Header from "@/components/blocks/Header";
import Footer from "@/components/blocks/Footer";
import localFont from "next/font/local";
// import { Analytics } from "@vercel/analytics/next"

// const geistSans = Geist({
// 	variable: "--font-geist-sans",
// 	subsets: ["latin"],
// });

const nippo = localFont({
	src: "./fonts/nippo.woff2",
	variable: "--font-nippo",
});	

const jakarta = Plus_Jakarta_Sans({
	variable: "--font-jakarta",
	subsets: ["latin"],
});

// const geistMono = Geist_Mono({
// 	variable: "--font-geist-mono",
// 	subsets: ["latin"],
// });

export const metadata: Metadata = {
	title: "contxt",
	description: "contxt",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body
				className={`${jakarta.variable} ${nippo.variable} antialiased`}
			>
				<Providers>
					<div className="grid h-svh grid-rows-[auto_1fr]">
						<Header />
						{children}
						{/* <Analytics /> */}
						<Footer />
					</div>
				</Providers>
			</body>
		</html>
	);
}
