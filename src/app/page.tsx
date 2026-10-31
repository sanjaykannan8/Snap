import { Bento } from "@/components/site/bento"
import { Hero } from "@/components/site/hero"
import { ScrollRevealText, SectionHeading } from "@/components/site/primitives"
import { RouterDemo } from "@/components/site/router-demo"
import { Audience, Comparison, Faq, FinalCta } from "@/components/site/sections"
import { SiteFooter } from "@/components/site/site-footer"
import { SiteNav } from "@/components/site/site-nav"

export default function Home() {
  return (
    <>
      <SiteNav />
      <main className="flex-1">
        <Hero />

        <section id="problem" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div className="flex flex-col gap-6">
              <span className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-brand-ink uppercase">
                <span className="size-1.5 rounded-full bg-brand" />
                The problem
              </span>
              <ScrollRevealText
                className="text-2xl leading-snug font-semibold tracking-tight sm:text-[32px]"
                text="Your skills live in different folders and your agents work in different tools. Snap gives each agent a way to discover a relevant skill from your library when a task calls for it."
              />
            </div>
            <div className="overflow-hidden rounded-3xl border border-border bg-white">
              <div className="border-b border-border px-6 py-4 text-xs font-semibold tracking-[0.12em] text-brand-ink uppercase">One library · multiple agents</div>
              <div className="grid gap-px bg-border sm:grid-cols-2">
                {[ ["01", "Publish", "Add a SKILL.md in your dashboard."], ["02", "Connect", "Give each agent its own API key."], ["03", "Route", "Your agent calls get_skill(problem)."], ["04", "Read", "Fetch the matched skill from a short-lived URL."] ].map(([number, title, text]) => <div key={number} className="bg-white p-6"><span className="font-mono text-xs text-brand-ink">{number}</span><h3 className="mt-4 font-semibold">{title}</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">{text}</p></div>)}
              </div>
            </div>
          </div>
        </section>

        <section id="demo" className="scroll-mt-20 border-y border-border bg-[#fafaf9]">
          <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-20 sm:px-6 sm:py-28">
            <SectionHeading
              eyebrow="How it works"
              title={<>Describe the task. Get the one skill that fits.</>}
            lede="Try an illustrative routing simulation. Your deployed service uses your configured decision model."
            />
            <RouterDemo />
          </div>
        </section>

        <section id="how" className="mx-auto flex max-w-6xl scroll-mt-20 flex-col gap-12 px-4 py-20 sm:px-6 sm:py-28">
          <SectionHeading
            eyebrow="What you get"
            title="A skill library built for routing"
            lede="A dashboard for your library, a standalone service for agents, and a single MCP tool."
          />
          <Bento />
        </section>

        <section id="compare" className="mx-auto flex max-w-6xl scroll-mt-20 flex-col gap-12 px-4 py-20 sm:px-6">
          <SectionHeading
            eyebrow="Why it's different"
            title="A library you can run yourself"
            lede="See how Snap fits alongside an agent's own skill loading."
          />
          <div className="overflow-x-auto">
            <div className="min-w-[560px]">
              <Comparison />
            </div>
          </div>
        </section>

        <section id="who" className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-20 sm:px-6">
          <SectionHeading eyebrow="Who it's for" title="Built for people working across agents" />
          <Audience />
        </section>

        <section id="faq" className="mx-auto grid max-w-6xl scroll-mt-20 gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[0.8fr_1.2fr]">
          <SectionHeading eyebrow="Details" title="Questions and limits" lede="What Snap does today, and what we haven't tested yet." />
          <Faq />
        </section>

        <section className="mx-auto max-w-6xl px-4 pt-8 pb-24 sm:px-6">
          <FinalCta />
        </section>
      </main>
      <SiteFooter />
    </>
  )
}
