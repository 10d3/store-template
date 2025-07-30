import { Facebook, Instagram, Twitter } from "lucide-react";
import Image from "next/image";
import React from "react";

export default function Footer() {
  return (
    <footer className="rounded-sm bg-background px-2">
      <div className="flex justify-between">
        <div>
          <Image src="/logo.png" alt="logo" width={100} height={100} />
        </div>
        <div className="flex flex-row justify-between items-center">
          <ul className="flex flex-row ">
            <li>
              <Instagram />
            </li>
            <li>
              <Facebook />
            </li>
            <li>
              <Twitter />
            </li>
          </ul>
        </div>
      </div>
      <div></div>
      <div></div>
    </footer>
  );
}
