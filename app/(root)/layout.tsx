import { NavMenu } from "@/components/shared/nav/navigation-menu";
import React from "react";

export default function Rootlayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* <div className="flex justify-center"> */}
        <nav className="fixed left-1/2 top-0 z-50 mt-2 flex w-11/12 max-w-7xl -translate-x-1/2 flex-col items-center rounded-full bg-background/20 p-3 backdrop-blur-lg md:rounded-full">
          <NavMenu />
        </nav>
      {/* </div> */}
      <main className="flex-1 flex-col">{children}</main>
    </>
  );
}
