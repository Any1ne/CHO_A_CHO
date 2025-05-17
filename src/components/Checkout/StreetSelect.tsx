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

interface Street {
  Ref: string;
  Description: string;
}

interface StreetSelectProps {
  streets: Street[];
  selectedStreet: string;
  onSelect: (street: string) => void;
}

export function StreetSelect({
  streets,
  selectedStreet,
  onSelect,
}: StreetSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredStreets = useMemo(() => {
    if (search.length < 2) return [];
    return streets
      .filter((street) =>
        street.Description.toLowerCase().includes(search.toLowerCase())
      )
      .slice(0, 100);
  }, [search, streets]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start">
          {selectedStreet || "Оберіть вулицю"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput
            placeholder="Пошук вулиці..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {search.length < 2 ? (
              <CommandEmpty>Введіть щонайменше 2 символи.</CommandEmpty>
            ) : filteredStreets.length === 0 ? (
              <CommandEmpty>Вулицю не знайдено.</CommandEmpty>
            ) : (
              filteredStreets.map((street) => (
                <CommandItem
                  key={street.Ref}
                  value={street.Description}
                  onSelect={() => {
                    onSelect(street.Description);
                    setOpen(false);
                  }}
                >
                  {street.Description}
                </CommandItem>
              ))
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
