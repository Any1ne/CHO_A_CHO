"use client";

import ProductGrid from "@/components/Catalogue/ProductGrid";
import ProductModal from "./Product/ProductModal";
// import CatalogueHeader from "./CatalogueHeader";
import CatalogueAnnouncement from "./CatalogueAnnouncement";
import ProductFilterPanel from "@/components/Catalogue/ProductFilterPanel";

export default function Catalogue() {
  return (
    <section className="py-4 px-2 md:px-10 lg:px-30 space-y-4 z-2">
      {/* <CatalogueHeader /> */}
      <CatalogueAnnouncement/>
      <ProductFilterPanel />
      <ProductGrid />
      <ProductModal />
    </section>
  );
}
