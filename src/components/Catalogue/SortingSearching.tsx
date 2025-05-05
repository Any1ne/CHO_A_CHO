import { useAppDispatch, useAppSelector } from "@/lib/hooks/hooks";
import { setSortOption, setSearchTerm } from "@/store/slices/catalogueSlice";

export default function SortingSearching() {
  const dispatch = useAppDispatch();
  const sortOption = useAppSelector((state) => state.catalogue.sortOption);
  const searchTerm = useAppSelector((state) => state.catalogue.searchTerm);

  return (
    <div className="flex items-center gap-4">
      <select
        id="sortOption"
        value={sortOption}
        onChange={(e) => dispatch(setSortOption(e.target.value))}
        className="border p-1 rounded"
      >
        <option value="">Sort by</option>
        <option value="low">Price: Low to High</option>
        <option value="high">Price: High to Low</option>
      </select>
      <input
        id="searchBar"
        type="text"
        value={searchTerm}
        onChange={(e) => dispatch(setSearchTerm(e.target.value))}
        placeholder="Search products..."
        className="border p-1 rounded flex-1"
      />
    </div>
  );
}
