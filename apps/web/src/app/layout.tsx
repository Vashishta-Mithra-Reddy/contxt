import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../index.css";
import Providers from "@/components/providers/providers";
import Header from "@/components/blocks/Header";
import Footer from "@/components/blocks/Footer";
import localFont from "next/font/local";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const nippo = localFont({
	src: "./fonts/nippo.woff2",
	variable: "--font-nippo",
});	

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

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
				className={`${geistSans.variable} ${nippo.variable} ${geistMono.variable} antialiased`}
			>
				<Providers>
					<div className="grid h-svh grid-rows-[auto_1fr]">
						<Header />
						{children}
						<Footer />
					</div>
				</Providers>
			</body>
		</html>
	);
}
