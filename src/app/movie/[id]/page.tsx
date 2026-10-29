import { MovieStudio } from "@/components/movie-studio";
import { getDossier, toPublicMovie } from "@/lib/dossier";
import { HttpError } from "@/lib/http";
import type { PublicMovie } from "@/lib/types";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

function StudioFallback() {
  return (
    <div className="mx-auto grid max-w-6xl gap-4 px-4 py-10">
      <p className="text-sm text-muted-foreground">Opening the film…</p>
      <div className="h-40 animate-pulse rounded-xl bg-muted" />
      <div className="h-64 animate-pulse rounded-xl bg-muted" />
    </div>
  );
}

async function MovieLoader({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let movie: PublicMovie | null = null;
  let message = "Could not load this film.";
  try {
    movie = toPublicMovie(await getDossier(id));
  } catch (error) {
    message = error instanceof HttpError ? error.message : message;
  }
  if (!movie) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" />
          Back to search
        </Link>
        <p className="mt-6 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm" role="alert">
          {message}
        </p>
      </div>
    );
  }
  return <MovieStudio movie={movie} />;
}

export default function MoviePage({ params }: PageProps<"/movie/[id]">) {
  return (
    <Suspense fallback={<StudioFallback />}>
      <MovieLoader params={params} />
    </Suspense>
  );
}
