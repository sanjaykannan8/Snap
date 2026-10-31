import Image from "next/image"
import Link from "next/link"

import { cn } from "@/lib/utils"

export function SnapLogo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link
      href={href}
      data-variant="ghost"
      className={cn("inline-flex items-center gap-2 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/40", className)}
    >
      <Image src="/snap-logo.svg" alt="" width={26} height={26} className="rounded-[6px]" priority />
      <span className="text-[17px] font-semibold tracking-tight text-foreground">Snap</span>
    </Link>
  )
}
