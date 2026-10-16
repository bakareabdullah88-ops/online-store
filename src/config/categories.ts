import {
  AccessoriesIcon,
  BeautyIcon,
  BooksIcon,
  FashionIcon,
  FoodIcon,
  PrintIcon,
  TechIcon,
  ThriftIcon,
} from "@/components/icons/kamplug-icons";
import type { AppIcon } from "@/components/icons/kamplug-icons";
import type { ArtMotif, CategoryId } from "@/services/types";
import type { ArtPalette } from "@/design/tokens";
import { type LucideIcon } from "lucide-react";

export type Category = {
  id: CategoryId;
  name: string;
  /** Short line for rails and empty states */
  blurb: string;
  motif: ArtMotif;
  palette: ArtPalette;
  icon: LucideIcon | AppIcon;
};

/** Static taxonomy. BACKEND-SEAM: could be served by the API later. */
export const categories: readonly Category[] = [
  {
    id: "fashion",
    icon: FashionIcon,
    name: "Fashion",
    blurb: "Made-on-campus streetwear and tailoring",
    motif: "tee",
    palette: "clay",
  },
  {
    id: "thrift",
    icon: ThriftIcon,
    name: "Thrift",
    blurb: "Vintage finds, one of one",
    motif: "jacket",
    palette: "sand",
  },
  {
    id: "food",
    icon: FoodIcon,
    name: "Food & snacks",
    blurb: "Small chops, jollof, late-night bites",
    motif: "bowl",
    palette: "ochre",
  },
  {
    id: "beauty",
    icon: BeautyIcon,
    name: "Skincare & beauty",
    blurb: "Shea, black soap, glow oils",
    motif: "dropper",
    palette: "rose",
  },
  {
    id: "accessories",
    icon: AccessoriesIcon,
    name: "Accessories",
    blurb: "Beads, bags and little extras",
    motif: "bracelet",
    palette: "plum",
  },
  {
    id: "print",
    icon: PrintIcon,
    name: "Print & design",
    blurb: "Posters, stickers, custom cards",
    motif: "poster",
    palette: "sea",
  },
  {
    id: "tech",
    icon: TechIcon,
    name: "Tech accessories",
    blurb: "Cases, cables, earbuds",
    motif: "earbuds",
    palette: "ink",
  },
  {
    id: "books",
    icon: BooksIcon,
    name: "Books & notes",
    blurb: "Past questions, novels, study packs",
    motif: "book",
    palette: "sage",
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
