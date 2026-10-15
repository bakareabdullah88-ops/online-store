"use client";

import { useParams, useSearchParams } from "next/navigation";
import { ProductEditor } from "./product-editor";

export function EditProduct() {
  const { id } = useParams<{ id: string }>();
  return <ProductEditor id={id} />;
}

/** /studio/products/new, optionally prefilled from another product (?from=<id>). */
export function NewProduct() {
  const from = useSearchParams().get("from");
  return <ProductEditor id={null} fromId={from} />;
}
