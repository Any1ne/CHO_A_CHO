import Filters from "@/components/Catalogue/Filters";
import ProductGrid from "@/components/Catalogue/ProductGrid";
import CategoryList from "@/components/Catalogue/CategoryList";

export default function Catalogue() {
  return (
    <section className="p-4 space-y-4">
      <CategoryList />
      <Filters />
      <ProductGrid />
    </section>
  );
}
