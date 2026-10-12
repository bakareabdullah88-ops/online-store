import type { ArtMotif, CategoryId } from "@/services/types";
import type { ArtPalette } from "@/design/tokens";

export type Category = {
  id: CategoryId;
  name: string;
  /** Short line for rails and empty states */
  blurb: string;
  motif: ArtMotif;
  palette: ArtPalette;
  /** Optional real photo in /public/seed, used instead of the generated art. */
  photo?: string;
};

/** Static taxonomy. BACKEND-SEAM: could be served by the API later. */
export const categories: readonly Category[] = [
  {
    id: "fashion",
    name: "Fashion",
    blurb: "Made-on-campus streetwear and tailoring",
    motif: "tee",
    palette: "clay",
    photo: "/seed/dress-2.jpg",
  },
  {
    id: "thrift",
    name: "Thrift",
    blurb: "Vintage finds, one of one",
    motif: "jacket",
    palette: "sand",
    photo: "/seed/jacket-5.jpg",
  },
  {
    id: "food",
    name: "Food & snacks",
    blurb: "Small chops, jollof, late-night bites",
    motif: "bowl",
    palette: "ochre",
    photo: "/seed/bowl-1.jpg",
  },
  {
    id: "beauty",
    name: "Skincare & beauty",
    blurb: "Shea, black soap, glow oils",
    motif: "dropper",
    palette: "rose",
    photo: "/seed/jar-1.jpg",
  },
  {
    id: "accessories",
    name: "Accessories",
    blurb: "Beads, bags and little extras",
    motif: "bracelet",
    palette: "plum",
    photo: "/seed/bracelet-3.jpg",
  },
  {
    id: "print",
    name: "Print & design",
    blurb: "Posters, stickers, custom cards",
    motif: "poster",
    palette: "sea",
    photo: "/seed/poster-1.jpg",
  },
  {
    id: "tech",
    name: "Tech accessories",
    blurb: "Cases, cables, earbuds",
    motif: "earbuds",
    palette: "ink",
    photo: "/seed/earbuds-3.jpg",
  },
  {
    id: "books",
    name: "Books & notes",
    blurb: "Past questions, novels, study packs",
    motif: "book",
    palette: "sage",
    photo: "/seed/book-6.jpg",
  },
] as const;

export function categoryById(id: CategoryId): Category {
  const c = categories.find((x) => x.id === id);
  if (!c) throw new Error(`Unknown category ${id}`);
  return c;
}

export function categoryName(id: CategoryId) {
  return categoryById(id).name;
}
