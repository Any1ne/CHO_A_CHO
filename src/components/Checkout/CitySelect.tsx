// components/CitySelect.tsx
import { useState } from "react";
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
  selectedCity: string;
  onSelect: (city: string) => void;
}

export function CitySelect({
  cities,
  selectedCity,
  onSelect,
}: CitySelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredCities = cities.filter((city) =>
    city.Description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start">
          {selectedCity || "Оберіть місто"}
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
            <CommandEmpty>Місто не знайдено.</CommandEmpty>
            {filteredCities.map((city) => (
              <CommandItem
                key={city.Ref}
                value={city.Description}
                onSelect={() => {
                  onSelect(city.Description);
                  setOpen(false);
                }}
              >
                {city.Description}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
