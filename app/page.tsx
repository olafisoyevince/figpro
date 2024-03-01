"use client";

import LeftSideBar from "@/components/LeftSideBar";
import Live from "@/components/Live";
import Navbar from "@/components/Navbar";
import RightSideBar from "@/components/RightSideBar";

export default function Page() {
    return (
        <main className=" h-screen overflow-hidden">
            <Navbar />

            <section className=" flex h-full flex-row">
                <LeftSideBar />
                <Live />
                <RightSideBar />
            </section>
        </main>
    );
}
