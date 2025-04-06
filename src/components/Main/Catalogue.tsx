import CatalogueHeader from "./Catalogue/CatalogueHeader";
import Filters from "./Catalogue//Filters";
import ProductGrid from "./Catalogue//ProductGrid";
import CategoryList from "./Catalogue/CategoryList";

export default function Catalogue() {
  return (
    <section className="p-4 space-y-4">
      <CategoryList />
      <Filters />
      <ProductGrid />
    </section>
  );
}
