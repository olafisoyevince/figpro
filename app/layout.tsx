import type { Metadata } from "next";
import "./globals.css";
import { Room } from "./Room";

export const metadata: Metadata = {
    title: "Figpro",
    description:
        "A minimalist Figma clone using Liveblocks and Fabric.js for real-time collaboration.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <head>
                <link
                    href="https://api.fontshare.com/v2/css?f[]=satoshi@900,700,500,300,400&display=swap"
                    rel="stylesheet"
                ></link>
            </head>
            <body className={` bg-primary-grey-200`}>
                <Room>{children}</Room>
            </body>
        </html>
    );
}
