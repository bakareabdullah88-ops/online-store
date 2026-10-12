"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { hashString } from "@/lib/random";
import { artPalettes, type ArtPalette } from "@/design/tokens";
import { BrandMark, CoverArt, ProductArt } from "@/components/art/product-art";
import { useObjectUrl } from "@/queries/media";
import type { ImageRef } from "@/services/types";

type Variant = "product" | "logo" | "cover";

type AppImageProps = {
  image: ImageRef | null | undefined;
  alt: string;
  variant?: Variant;
  /** Name used for the logo fallback initials */
  name?: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
};

const paletteKeys = Object.keys(artPalettes) as ArtPalette[];

function fallbackPalette(key: string): ArtPalette {
  return paletteKeys[hashString(key) % paletteKeys.length] ?? "sand";
}

/**
 * The one image component. Renders generated art, IndexedDB blobs or static
 * URLs, always with a tonal placeholder and a blur-up fade so nothing ever
 * looks broken. The parent decides the box size; this fills it.
 */
export function AppImage({
  image,
  alt,
  variant = "product",
  name,
  className,
  sizes = "(min-width: 1024px) 25vw, 50vw",
  priority,
}: AppImageProps) {
  const box = cn("relative block size-full overflow-hidden bg-sand", className);

  if (!image) {
    return (
      <span className={box} role="img" aria-label={alt}>
        <Fallback variant={variant} name={name ?? alt} />
      </span>
    );
  }

  if (image.kind === "art") {
    return (
      <span className={box} role="img" aria-label={alt}>
        {variant === "logo" ? (
          <BrandMark name={name ?? alt} palette={image.palette} className="size-full" />
        ) : variant === "cover" ? (
          <CoverArt palette={image.palette} seed={image.seed} motif={image.motif} className="size-full" />
        ) : (
          <ProductArt motif={image.motif} palette={image.palette} seed={image.seed} className="size-full" />
        )}
      </span>
    );
  }

  if (image.kind === "blob") {
    return <BlobImage id={image.id} alt={alt} className={box} variant={variant} name={name} />;
  }

  return (
    <span className={box}>
      <Image
        src={image.src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className="object-cover"
        {...(image.blurDataURL ? { placeholder: "blur" as const, blurDataURL: image.blurDataURL } : {})}
      />
    </span>
  );
}

function Fallback({ variant, name }: { variant: Variant; name: string }) {
  const palette = fallbackPalette(name);
  if (variant === "logo") return <BrandMark name={name} palette={palette} className="size-full" />;
  return <ProductArt motif="monogram" palette={palette} seed={hashString(name)} className="size-full opacity-60" />;
}

function BlobImage({
  id,
  alt,
  className,
  variant,
  name,
}: {
  id: string;
  alt: string;
  className: string;
  variant: Variant;
  name: string | undefined;
}) {
  const url = useObjectUrl(id);
  const [loaded, setLoaded] = useState(false);
  return (
    <span className={className}>
      <span
        className={cn("absolute inset-0 transition-opacity duration-300", loaded ? "opacity-0" : "opacity-100")}
        aria-hidden
      >
        {url === null ? (
          <Fallback variant={variant} name={name ?? alt} />
        ) : (
          <span className="absolute inset-0 animate-pulse bg-skeleton" />
        )}
      </span>
      {url && (
        // eslint-disable-next-line @next/next/no-img-element -- blob: URLs are local; next/image cannot optimise them
        <img
          src={url}
          alt={alt}
          onLoad={() => setLoaded(true)}
          className={cn(
            "absolute inset-0 size-full object-cover transition-[opacity,filter,scale] duration-500 ease-out",
            loaded ? "scale-100 opacity-100 blur-0" : "scale-[1.03] opacity-0 blur-md",
          )}
        />
      )}
    </span>
  );
}
