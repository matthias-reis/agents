import { Title } from "@solidjs/meta";
import { HttpStatusCode } from "@solidjs/start";

export default function NotFound() {
  return (
    <section class="flex flex-col items-center justify-center gap-4 rounded-2xl border border-rose-500/30 bg-rose-950/20 p-8 text-center text-sm text-rose-100">
      <Title>Not Found</Title>
      <HttpStatusCode code={404} />
      <h1 class="text-4xl font-semibold text-rose-200">Page not found</h1>
      <p class="max-w-md text-rose-100/80">
        We could not find the page you were looking for. Try returning to the home page or heading
        to the docs to continue exploring.
      </p>
      <div class="flex flex-wrap justify-center gap-3">
        <a
          class="rounded-full border border-slate-800 bg-slate-900/60 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-sky-200 transition hover:border-sky-500/60 hover:bg-slate-900"
          href="/"
        >
          Back Home
        </a>
        <a
          class="rounded-full border border-slate-800 bg-transparent px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200 transition hover:border-sky-500/60 hover:text-sky-200"
          href="https://start.solidjs.com"
          rel="noreferrer"
          target="_blank"
        >
          SolidStart Docs
        </a>
      </div>
    </section>
  );
}
