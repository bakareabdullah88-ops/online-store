"use client";

import Image from "next/image";
import { useState } from "react";
import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import { hashString } from "@/lib/random";
import { artPalettes, type ArtPalette } from "@/design/tokens";
import { BrandMark, ProductArt } from "@/components/art/product-art";
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

/** Responsive image widths by use, unless the caller passes `sizes`. */
const defaultSizes: Record<Variant, string> = {
  product: "(min-width: 1024px) 25vw, 50vw",
  cover: "(min-width: 1280px) 1200px, 100vw",
  logo: "128px",
};

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
  sizes,
  priority,
}: AppImageProps) {
  const box = cn("relative block size-full overflow-hidden bg-sand", className);
  // Empty alt means decorative: hide it rather than announce an unnamed image.
  const a11y = alt ? { role: "img" as const, "aria-label": alt } : { "aria-hidden": true as const };

  if (!image) {
    return (
      <span className={box} {...a11y}>
        <Fallback variant={variant} name={name ?? alt} />
      </span>
    );
  }

  if (image.kind === "art") {
    return (
      <span className={box} {...a11y}>
        {variant === "logo" ? (
          <BrandMark name={name ?? alt} palette={image.palette} className="size-full" />
        ) : variant === "cover" ? (
          // Shops without an uploaded cover get a plain tint, never a stand-in picture.
          <span
            className="block size-full"
            style={{
              background: `linear-gradient(135deg, ${artPalettes[image.palette][4]}, ${artPalettes[image.palette][1]})`,
            }}
          />
        ) : (
          <ProductArt
            motif={image.motif}
            palette={image.palette}
            seed={image.seed}
            className="size-full"
          />
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
        sizes={sizes ?? defaultSizes[variant]}
        priority={priority}
        className="object-cover"
        {...(image.blurDataURL
          ? { placeholder: "blur" as const, blurDataURL: image.blurDataURL }
          : {})}
      />
    </span>
  );
}

function Fallback({ variant, name }: { variant: Variant; name: string }) {
  const palette = fallbackPalette(name);
  if (variant === "logo") return <BrandMark name={name} palette={palette} className="size-full" />;
  return (
    <span className="grid size-full place-items-center bg-surface-2 text-faint">
      <ImageIcon className="size-[28%] max-h-10 min-h-4 max-w-10 min-w-4" strokeWidth={1.5} />
    </span>
  );
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
  const [failed, setFailed] = useState(false);
  return (
    <span className={className}>
      <span
        className={cn(
          "absolute inset-0 transition-opacity duration-300",
          loaded ? "opacity-0" : "opacity-100",
        )}
        aria-hidden
      >
        {url === null || failed ? (
          <Fallback variant={variant} name={name ?? alt} />
        ) : (
          <span className="absolute inset-0 animate-pulse bg-skeleton" />
        )}
      </span>
      {url && (
        // eslint-disable-next-line @next/next/no-img-element -- blob: URLs and /api/media redirects; next/image can't optimise them
        <img
          src={url}
          alt={alt}
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={cn(
            "absolute inset-0 size-full object-cover transition-[opacity,filter,scale] duration-500 ease-out",
            loaded ? "blur-0 scale-100 opacity-100" : "scale-[1.03] opacity-0 blur-md",
          )}
        />
      )}
    </span>
  );
}
