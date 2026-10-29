import type { Metadata } from "next";
import { Fraunces, Source_Sans_3 } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const sans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Up to here",
  description: "Catch up on a movie without walking past the part you have already watched.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable} dark h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:bg-paper focus:px-3 focus:py-2 focus:text-ink"
        >
          Skip to content
        </a>
        <header className="border-b border-border/80">
          <div className="mx-auto flex max-w-6xl items-end justify-between gap-4 px-4 py-4">
            <Link href="/" className="block">
              <span className="font-display text-2xl tracking-tight text-foreground">Up to here</span>
              <span className="mt-0.5 block text-sm text-muted-foreground">
                Movie catch-up, cut where you stopped
              </span>
            </Link>
          </div>
        </header>
        <main id="content" className="flex-1">
          {children}
        </main>
        <footer className="mt-8 border-t border-border/80">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-xs leading-5 text-muted-foreground">
            <p>
              This product uses the TMDB API but is not endorsed or certified by{" "}
              <a className="underline decoration-border underline-offset-2" href="https://www.themoviedb.org/">
                TMDB
              </a>
              . A public launch should also show the official TMDB logo, per their terms.
            </p>
            <p>
              When a plot is available, it comes from the English Wikipedia plot section and is used under CC
              BY-SA. Recaps and answers are derived from that text plus TMDB metadata. They are not studio
              summaries, and they stay inside the portion you have marked as watched.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
