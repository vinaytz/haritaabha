"use client";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function ProductGallery({ images, name }: { images: { url: string; alt: string }[]; name: string }) {
  const [emblaRef, embla] = useEmblaCarousel({ loop: false, align: "start" });
  const [index, setIndex] = useState(0);

  const onSelect = useCallback(() => embla && setIndex(embla.selectedScrollSnap()), [embla]);
  useEffect(() => {
    if (!embla) return;
    embla.on("select", onSelect);
    return () => {
      embla.off("select", onSelect);
    };
  }, [embla, onSelect]);

  if (!images.length) {
    return <div className="grid aspect-[4/5] place-items-center rounded-[var(--radius-surface)] bg-mist text-ink-faint">No photo yet</div>;
  }

  return (
    <div className="flex flex-col-reverse gap-3 md:flex-row md:gap-4">
      {images.length > 1 && (
        <div className="hidden w-20 shrink-0 flex-col gap-3 md:flex" role="tablist" aria-label="Product photos">
          {images.map((img, i) => (
            <button
              key={img.url}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Photo ${i + 1} of ${images.length}`}
              onClick={() => embla?.scrollTo(i)}
              className={cn(
                "relative aspect-[4/5] overflow-hidden rounded-lg bg-mist ring-offset-2 transition",
                i === index ? "ring-2 ring-ink" : "opacity-70 hover:opacity-100",
              )}
            >
              <Image src={img.url} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
      <div className="relative min-w-0 flex-1">
        <div ref={emblaRef} className="overflow-hidden rounded-[var(--radius-surface)] bg-mist">
          <div className="flex touch-pan-y">
            {images.map((img, i) => (
              <div key={img.url} className="relative aspect-[4/5] min-w-0 flex-[0_0_100%]">
                <Image
                  src={img.url}
                  alt={img.alt || name}
                  fill
                  priority={i === 0}
                  sizes="(min-width: 1024px) 560px, (min-width: 768px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>
        {images.length > 1 && (
          <div className="mt-3 flex justify-center gap-1.5 md:hidden" aria-hidden="true">
            {images.map((_, i) => (
              <span key={i} className={cn("h-1.5 rounded-full transition-all", i === index ? "w-5 bg-ink" : "w-1.5 bg-line-strong")} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
