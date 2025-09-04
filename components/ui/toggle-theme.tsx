"use client";

import { PiMonitorFill } from "react-icons/pi";
import { HiMoon, HiSun } from "react-icons/hi2";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface ModeToggleProps {
  isNav?: boolean;
  className?: string;
}

export function ModeToggle({ isNav = false, className }: ModeToggleProps) {
  const { setTheme, theme } = useTheme();

  if (isNav) {
    return (
      <div
        className={cn(
          "flex items-center gap-0.5 rounded-lg border border-border/50 bg-secondary/80 backdrop-blur-sm p-1 shadow-sm transition-all duration-200 hover:shadow-md",
          className
        )}
      >
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-7 w-7 rounded-md transition-all duration-200 hover:bg-muted/80 cursor-pointer",
            theme === "light" && "bg-primary text-primary-foreground shadow-sm"
          )}
          onClick={() => setTheme("light")}
        >
          <HiSun className="h-3.5 w-3.5" />
          <span className="sr-only">Light mode</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-7 w-7 rounded-md transition-all duration-200 hover:bg-muted/80 cursor-pointer",
            theme === "dark" && "bg-primary text-primary-foreground shadow-sm"
          )}
          onClick={() => setTheme("dark")}
        >
          <HiMoon className="h-3.5 w-3.5" />
          <span className="sr-only">Dark mode</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-7 w-7 rounded-md transition-all duration-200 hover:bg-muted/80 cursor-pointer",
            theme === "system" && "bg-primary text-primary-foreground shadow-sm"
          )}
          onClick={() => setTheme("system")}
        >
          <PiMonitorFill className="h-3.5 w-3.5" />
          <span className="sr-only">System mode</span>
        </Button>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative h-9 w-9 rounded-lg border-border/50 bg-background/80 backdrop-blur-sm shadow-sm transition-all duration-200 hover:bg-muted/80 hover:shadow-md hover:border-border"
        >
          <HiSun className="h-4 w-4 rotate-0 scale-100 transition-all duration-300 ease-in-out dark:-rotate-90 dark:scale-0" />
          <HiMoon className="absolute h-4 w-4 rotate-90 scale-0 transition-all duration-300 ease-in-out dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="min-w-[120px] rounded-lg border-border/50 bg-background/95 backdrop-blur-sm shadow-lg"
      >
        <DropdownMenuItem
          onClick={() => setTheme("light")}
          className="rounded-md transition-colors duration-150 hover:bg-muted/80 focus:bg-muted/80"
        >
          <HiSun className="mr-2 h-4 w-4" />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("dark")}
          className="rounded-md transition-colors duration-150 hover:bg-muted/80 focus:bg-muted/80"
        >
          <HiMoon className="mr-2 h-4 w-4" />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme("system")}
          className="rounded-md transition-colors duration-150 hover:bg-muted/80 focus:bg-muted/80"
        >
          <PiMonitorFill className="mr-2 h-4 w-4" />
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
