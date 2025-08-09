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
import { Warehouse } from "@/types";

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
    .filter((w) => w.Description.toLowerCase().includes(loweredSearch))
    .sort((a, b) => {
      // Спочатку Відділення, потім Поштомати
      const aType = a.TypeOfWarehouseRef === "841339c7-591a-42e2-8233-7a0a00f0ed6f" ? 0 : 1;
      const bType = b.TypeOfWarehouseRef === "841339c7-591a-42e2-8233-7a0a00f0ed6f" ? 0 : 1;

      if (aType !== bType) return aType - bType;

      // Додатково — по входженню пошукового слова
      const aIndex = a.Description.toLowerCase().indexOf(loweredSearch);
      const bIndex = b.Description.toLowerCase().indexOf(loweredSearch);
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
