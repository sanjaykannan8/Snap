"use client"

import { IconBolt, IconBook2, IconBrandGithub, IconLayoutDashboard, IconPlug, IconUsersGroup } from "@tabler/icons-react"
import Link from "next/link"
import { useEffect, useState } from "react"

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { useSession } from "@/components/auth/session-provider"
import { SoundToggle } from "@/components/ui/sound"
import { cn } from "@/lib/utils"

import { SnapLogo } from "./logo"

const PRODUCT = [
  {
    href: "/dashboard",
    icon: IconLayoutDashboard,
    title: "Dashboard",
    text: "Add SKILL.md files and manage agent keys.",
  },
  {
    href: "/#how",
    icon: IconPlug,
    title: "One MCP tool",
    text: "get_skill(problem) is the only tool your agent sees.",
  },
  {
    href: "/#demo",
    icon: IconBolt,
    title: "Decision model",
    text: "Picks a skill from your library in one pass.",
  },
  {
    href: "/#teams",
    icon: IconUsersGroup,
    title: "Your library",
    text: "Connect multiple agents to your own skills.",
  },
]

export function SiteNav() {
  const [scrolled, setScrolled] = useState(false)
  const { user } = useSession()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full transition-[background-color,box-shadow,backdrop-filter] duration-200",
        scrolled ? "bg-white/80 shadow-[0_1px_0_0_var(--border)] backdrop-blur-md" : "bg-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <SnapLogo />

        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger className="text-[#52524C] hover:text-foreground data-popup-open:text-foreground">
                Product
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[460px] grid-cols-2 gap-1 p-1">
                  {PRODUCT.map((item) => (
                    <li key={item.title}>
                      <NavigationMenuLink
                        href={item.href}
                        className="items-start gap-3 rounded-lg p-3"
                      >
                        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-brand-soft text-brand-ink">
                          <item.icon className="size-4" />
                        </span>
                        <span className="flex flex-col gap-0.5">
                          <span className="text-sm font-medium text-foreground">{item.title}</span>
                          <span className="text-xs leading-snug text-[#52524C]">{item.text}</span>
                        </span>
                      </NavigationMenuLink>
                    </li>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink
                href="/#demo"
                className={cn(navigationMenuTriggerStyle(), "text-[#52524C] hover:text-foreground")}
              >
                How it works
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink
                href="/#compare"
                className={cn(navigationMenuTriggerStyle(), "text-[#52524C] hover:text-foreground")}
              >
                Compare
              </NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink
                href="/#faq"
                className={cn(navigationMenuTriggerStyle(), "gap-1.5 text-[#52524C] hover:text-foreground")}
              >
                <IconBook2 className="size-4" /> Docs
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        <div className="flex items-center gap-2">
          <a href="https://github.com/sanjaykannan8/Snap" aria-label="Snap on GitHub" className="inline-flex h-9 items-center gap-2 rounded-full border border-border px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"><IconBrandGithub className="size-4" aria-hidden="true" /><span className="hidden sm:inline">GitHub</span></a>
          <SoundToggle />
          {user ? (
            <Link
              href="/dashboard"
              className="inline-flex h-9 items-center rounded-full bg-foreground px-4 text-sm font-medium text-white transition-transform outline-none hover:bg-foreground/90 focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.97]"
            >
              Open dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                data-variant="ghost"

                className="hidden h-9 items-center rounded-full px-3 text-sm font-medium text-[#52524C] hover:text-foreground sm:inline-flex"
              >
                Log in
              </Link>
              <Link
                href="/login?mode=register"
                className="inline-flex h-9 items-center rounded-full bg-foreground px-4 text-sm font-medium text-white transition-transform outline-none hover:bg-foreground/90 focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.97]"
              >
                Get started
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
