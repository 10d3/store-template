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
        <nav className="fixed left-1/2 top-0 z-50 mt-2 flex w-fit max-w-7xl -translate-x-1/2 flex-col items-center rounded-full py-1 px-4 bg-background md:rounded-lg">
          <NavMenu />
        </nav>
      {/* </div> */}
      <main className="flex-1 flex-col mt-4">{children}</main>
    </>
  );
}
