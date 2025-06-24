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

interface City {
  Ref: string;
  Description: string;
}
interface CitySelectProps {
  cities: City[];
  selectedCity: City;
  onSelect: (city: City) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

export function CitySelect({
  cities,
  selectedCity,
  onSelect,
  open,
  setOpen,
}: CitySelectProps) {
  const [search, setSearch] = useState("");

  const filteredCities = useMemo(() => {
    if (search.length < 2) return [];
    return cities
      .filter((city) =>
        city.Description.toLowerCase().includes(search.toLowerCase())
      )
      .slice(0, 100);
  }, [search, cities]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start overflow-hidden"
        >
          {selectedCity?.Description || "Оберіть місто"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput
            placeholder="Пошук міста..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {search.length < 2 ? (
              <CommandEmpty>Введіть щонайменше 2 символи.</CommandEmpty>
            ) : filteredCities.length === 0 ? (
              <CommandEmpty>Місто не знайдено.</CommandEmpty>
            ) : (
              filteredCities.map((city) => (
                <CommandItem
                  key={city.Ref}
                  value={city.Description}
                  onSelect={() => {
                    onSelect(city);
                    setOpen(false); // закриваємо поповер після вибору
                  }}
                >
                  {city.Description}
                </CommandItem>
              ))
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

