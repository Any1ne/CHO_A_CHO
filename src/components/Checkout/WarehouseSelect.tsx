import { useState, useMemo } from "react";
import {
  Command,
  CommandInput,
  CommandList,
  CommandItem,
  CommandEmpty,
} from "@/components/ui/command";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

interface Warehouse {
  Ref: string;
  Description: string;
}

interface WarehouseSelectProps {
  warehouses: Warehouse[];
  selectedWarehouse: string;
  onSelect: (warehouse: string) => void;
}

export function WarehouseSelect({
  warehouses,
  selectedWarehouse,
  onSelect,
}: WarehouseSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredWarehouses = useMemo(() => {
  if (search.length < 1) return [];

  const loweredSearch = search.toLowerCase();

  return warehouses
    .filter((w) =>
      w.Description.toLowerCase().includes(loweredSearch)
    )
    .sort((a, b) => {
      const aDesc = a.Description.toLowerCase();
      const bDesc = b.Description.toLowerCase();

      const aStartsWith = aDesc.startsWith(loweredSearch) ? 0 : 1;
      const bStartsWith = bDesc.startsWith(loweredSearch) ? 0 : 1;

      if (aStartsWith !== bStartsWith) return aStartsWith - bStartsWith;

      // Додаткове сортування — за позицією входження
      const aIndex = aDesc.indexOf(loweredSearch);
      const bIndex = bDesc.indexOf(loweredSearch);
      return aIndex - bIndex;
    })
    .slice(0, 100);
}, [search, warehouses]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start overflow-hidden">
          {selectedWarehouse || "Оберіть відділення"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput
            placeholder="Пошук відділення..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {search.length < 1 ? (
              <CommandEmpty>Введіть щонайменше 1 символ.</CommandEmpty>
            ) : filteredWarehouses.length === 0 ? (
              <CommandEmpty>Відділення не знайдено.</CommandEmpty>
            ) : (
              filteredWarehouses.map((warehouse) => (
                <CommandItem
                  key={warehouse.Ref}
                  value={warehouse.Description}
                  onSelect={() => {
                    onSelect(warehouse.Description);
                    setOpen(false);
                  }}
                >
                  {warehouse.Description}
                </CommandItem>
              ))
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
