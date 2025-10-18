import { Title } from "@solidjs/meta";

export default function About() {
  return (
    <section class="space-y-6">
      <Title>About the Starter</Title>
      <div class="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 text-sm leading-relaxed text-slate-300">
        <h2 class="text-xl font-semibold text-sky-200">Purpose</h2>
        <p class="mt-2">
          This repository bootstraps a modern SolidStart + Tailwind application and pairs it with
          documentation scaffolding aimed at AI-assisted agent workflows. It provides sensible
          defaults for linting, formatting, testing, and CI so future work can focus on features.
        </p>
        <p class="mt-4">
          Single Source of Truth documentation lives under <code>docs/</code>. Provider instruction
          files link back to those canonical references to prevent duplication.
        </p>
      </div>
      <div class="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 text-sm leading-relaxed text-slate-300">
        <h3 class="text-lg font-semibold text-sky-200">Next steps</h3>
        <ul class="mt-3 list-disc space-y-2 pl-5 text-slate-300">
          <li>Add feature-specific ADRs as architectural decisions evolve.</li>
          <li>Extend tests with component stories and integration coverage.</li>
          <li>Wire agent orchestration services once backend APIs become available.</li>
        </ul>
      </div>
    </section>
  );
}
