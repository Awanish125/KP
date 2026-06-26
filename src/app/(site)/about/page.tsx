import Link from "next/link";

export default function AboutPage() {
  return (
    <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
      <div className="space-y-6">
        <p className="text-sm font-semibold uppercase tracking-[0.35em] text-rose-600 dark:text-rose-300">
          About the site layout
        </p>
        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-5xl">
          This page uses a different shell from the homepage.
        </h1>
        <p className="max-w-xl text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-lg">
          Route groups let us keep the home experience and the inner pages
          visually distinct while still sharing the same app root.
        </p>
        <Link
          href="/"
          className="inline-flex items-center rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
        >
          Back to home
        </Link>
      </div>

      <div className="rounded-[2rem] border border-slate-200 bg-white/80 p-6 backdrop-blur dark:border-white/10 dark:bg-white/5">
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-slate-900/80">
            <p className="text-sm text-slate-500 dark:text-slate-400">Layout rule</p>
            <p className="mt-2 text-lg font-medium text-slate-950 dark:text-white">
              Parent layout stays in `src/app/layout.tsx`.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-slate-900/80">
            <p className="text-sm text-slate-500 dark:text-slate-400">Section rule</p>
            <p className="mt-2 text-lg font-medium text-slate-950 dark:text-white">
              Home and content sections import their own layout components.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-white/10 dark:bg-slate-900/80">
            <p className="text-sm text-slate-500 dark:text-slate-400">Import rule</p>
            <p className="mt-2 text-lg font-medium text-slate-950 dark:text-white">
              `@components/*` replaces deep relative imports.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
