import { Title } from "@solidjs/meta";
import Counter from "~/components/Counter";

export default function Home() {
  return (
    <section class="space-y-8">
      <Title>Agents Playground</Title>
      <div class="space-y-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-6 shadow-2xl shadow-slate-900/30 backdrop-blur">
        <h2 class="text-2xl font-semibold text-sky-200 md:text-3xl">
          Welcome to the Agent playground
        </h2>
        <p class="text-sm leading-relaxed text-slate-300">
          This SolidStart shell is pre-wired with Tailwind, testing, linting, and documentation
          scaffolding so you can focus on building agent-driven experiences. Use the counter demo
          below to verify reactivity, then swap in your own components.
        </p>
        <Counter />
      </div>
      <div class="grid gap-6 md:grid-cols-2">
        <a
          class="group rounded-xl border border-slate-800 bg-slate-900/50 p-5 transition hover:border-sky-500/60 hover:bg-slate-900/70"
          href="https://start.solidjs.com"
          rel="noreferrer"
          target="_blank"
        >
          <h3 class="text-lg font-semibold text-sky-200 transition group-hover:text-sky-100">
            SolidStart docs →
          </h3>
          <p class="mt-2 text-sm text-slate-300">
            Explore the official documentation to deepen your understanding of routing, data
            loading, and deployment.
          </p>
        </a>
        <a
          class="group rounded-xl border border-slate-800 bg-slate-900/50 p-5 transition hover:border-sky-500/60 hover:bg-slate-900/70"
          href="https://tailwindcss.com/docs"
          rel="noreferrer"
          target="_blank"
        >
          <h3 class="text-lg font-semibold text-sky-200 transition group-hover:text-sky-100">
            Tailwind cheat-sheet →
          </h3>
          <p class="mt-2 text-sm text-slate-300">
            Quickly design new UI with composable utility classes and responsive variants.
          </p>
        </a>
      </div>
    </section>
  );
}
