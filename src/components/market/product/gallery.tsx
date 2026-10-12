"use client";

import { AnimatePresence, motion, useReducedMotion, type PanInfo } from "motion/react";
import { ViewTransition, useState, type Ref } from "react";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { Dialog as RDialog, VisuallyHidden } from "radix-ui";
import { AppImage } from "@/components/ui/app-image";
import { spring } from "@/design/motion";
import { cn } from "@/lib/cn";
import type { ImageRef } from "@/services/types";
import { productTransitionName } from "../product-card";

function ZoomViewer({
  open,
  onOpenChange,
  images,
  index,
  setIndex,
  name,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  images: ImageRef[];
  index: number;
  setIndex: (i: number) => void;
  name: string;
}) {
  const [zoomed, setZoomed] = useState(false);
  const reduce = useReducedMotion();
  const go = (d: number) => {
    setZoomed(false);
    setIndex((index + d + images.length) % images.length);
  };
  return (
    <RDialog.Root
      open={open}
      onOpenChange={(v) => {
        setZoomed(false);
        onOpenChange(v);
      }}
    >
      <AnimatePresence>
        {open && (
          <RDialog.Portal forceMount>
            <RDialog.Content
              asChild
              forceMount
              aria-describedby={undefined}
              onKeyDown={(e) => {
                if (e.key === "ArrowRight") go(1);
                if (e.key === "ArrowLeft") go(-1);
              }}
            >
              <motion.div
                className="fixed inset-0 z-(--z-sheet) flex flex-col bg-canvas"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <VisuallyHidden.Root>
                  <RDialog.Title>
                    {name}: image {index + 1} of {images.length}
                  </RDialog.Title>
                </VisuallyHidden.Root>
                <div className="flex h-14 items-center justify-between px-4">
                  <span className="font-mono text-small text-muted tabular">
                    {index + 1} / {images.length}
                  </span>
                  <span className="hidden text-small text-muted sm:block">
                    {zoomed ? "Drag to look around · tap to zoom out" : "Tap the image to zoom"}
                  </span>
                  <RDialog.Close
                    className="flex size-10 items-center justify-center rounded-md hover:bg-ink/[0.06]"
                    aria-label="Close viewer"
                  >
                    <X className="size-5" />
                  </RDialog.Close>
                </div>
                <div className="relative min-h-0 flex-1 overflow-hidden">
                  <motion.button
                    type="button"
                    aria-label={zoomed ? "Zoom out" : "Zoom in"}
                    onClick={() => setZoomed((z) => !z)}
                    className={cn(
                      "absolute inset-0 m-auto aspect-[4/5] max-h-full max-w-full",
                      zoomed ? "cursor-zoom-out" : "cursor-zoom-in",
                    )}
                    animate={{ scale: zoomed && !reduce ? 2.2 : 1 }}
                    transition={spring.smooth}
                    drag={zoomed}
                    dragConstraints={{ left: -260, right: 260, top: -320, bottom: 320 }}
                    dragElastic={0.1}
                  >
                    <AppImage
                      image={images[index]}
                      alt={`${name}, image ${index + 1}`}
                      sizes="100vw"
                    />
                  </motion.button>
                  {images.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() => go(-1)}
                        className="absolute top-1/2 left-3 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-surface shadow-md"
                        aria-label="Previous image"
                      >
                        <ChevronLeft className="size-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => go(1)}
                        className="absolute top-1/2 right-3 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-surface shadow-md"
                        aria-label="Next image"
                      >
                        <ChevronRight className="size-5" />
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            </RDialog.Content>
          </RDialog.Portal>
        )}
      </AnimatePresence>
    </RDialog.Root>
  );
}

/**
 * Product gallery. Phones: swipe carousel with dots. Desktop: main image with
 * a thumbnail rail. Tap to open a zoomable full-screen viewer.
 */
export function Gallery({
  images,
  name,
  productId,
  heroRef,
}: {
  images: ImageRef[];
  name: string;
  productId: string;
  heroRef?: Ref<HTMLDivElement>;
}) {
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(0);
  const [zoom, setZoom] = useState(false);
  const reduce = useReducedMotion();
  const count = images.length;

  const go = (i: number) => {
    const next = (i + count) % count;
    setDir(next > index ? 1 : -1);
    setIndex(next);
  };

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -50 || info.velocity.x < -400) go(index + 1);
    else if (info.offset.x > 50 || info.velocity.x > 400) go(index - 1);
  };

  return (
    <div className="flex flex-col-reverse gap-3 md:flex-row">
      {count > 1 && (
        <ul
          className="scrollbar-none hidden gap-3 md:flex md:w-20 md:flex-col"
          aria-label="Product images"
        >
          {images.map((img, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => go(i)}
                aria-label={`Show image ${i + 1}`}
                aria-current={i === index}
                className={cn(
                  "block aspect-[4/5] w-full overflow-hidden rounded-sm transition-[opacity,box-shadow]",
                  i === index
                    ? "shadow-[0_0_0_2px_var(--canvas),0_0_0_3.5px_var(--ink)]"
                    : "opacity-60 hover:opacity-100",
                )}
              >
                <AppImage image={img} alt="" sizes="80px" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="relative min-w-0 flex-1">
        <div
          ref={heroRef}
          className="relative aspect-[4/5] overflow-hidden bg-sand max-md:-mx-(--gutter) md:rounded-lg"
        >
          <ViewTransition name={productTransitionName(productId)} share="morph" default="none">
            <div className="absolute inset-0">
              <AnimatePresence initial={false} custom={dir} mode="popLayout">
                <motion.div
                  key={index}
                  custom={dir}
                  className="absolute inset-0 touch-pan-y"
                  initial={reduce ? { opacity: 0 } : { x: dir > 0 ? "100%" : "-100%" }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={reduce ? { opacity: 0 } : { x: dir > 0 ? "-100%" : "100%" }}
                  transition={spring.smooth}
                  drag={count > 1 && !reduce ? "x" : false}
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.25}
                  onDragEnd={onDragEnd}
                >
                  <button
                    type="button"
                    className="block size-full cursor-zoom-in"
                    onClick={() => setZoom(true)}
                    aria-label={`Open ${name} image ${index + 1} full screen`}
                  >
                    <AppImage
                      image={images[index]}
                      alt={`${name}, image ${index + 1} of ${count}`}
                      priority={index === 0}
                      sizes="(min-width: 768px) 55vw, 100vw"
                    />
                  </button>
                </motion.div>
              </AnimatePresence>
            </div>
          </ViewTransition>
          <button
            type="button"
            onClick={() => setZoom(true)}
            className="absolute right-3 bottom-3 hidden size-10 items-center justify-center rounded-full bg-surface/90 shadow-sm backdrop-blur md:flex"
            aria-label="View full screen"
          >
            <Expand className="size-4.5" />
          </button>
          {count > 1 && (
            <div
              className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5 md:hidden"
              aria-hidden
            >
              {images.map((_, i) => (
                <span
                  key={i}
                  className={cn(
                    "h-1.5 rounded-full bg-surface/90 shadow-xs transition-all duration-300",
                    i === index ? "w-5" : "w-1.5 opacity-60",
                  )}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      <ZoomViewer
        open={zoom}
        onOpenChange={setZoom}
        images={images}
        index={index}
        setIndex={(i) => go(i)}
        name={name}
      />
    </div>
  );
}
