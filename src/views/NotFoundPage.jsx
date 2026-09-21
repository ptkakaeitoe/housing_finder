import Link from "next/link";

export default function NotFoundPage() {
  return <main className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-12">
    <p className="text-sm font-semibold text-accent">404</p>
    <h1 className="mt-4 text-4xl font-semibold tracking-tight text-ink">Page not found.</h1>
    <Link href="/" className="mt-7 inline-flex text-sm font-semibold text-ink underline underline-offset-4 hover:text-accent">Explore homes →</Link>
  </main>;
}
