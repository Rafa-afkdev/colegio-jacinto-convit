"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const Secciones = [
  { value: '1ro "A"', label: '1ro "A"' },
  { value: '1ro "B"', label: '1ro "B"' },
  { value: '1ro "C"', label: '1ro "C"' },
  { value: '2do "A"', label: '2do "A"' },
  { value: '2do "B"', label: '2do "B"' },
  { value: '3ro "A"', label: '3ro "A"' },
  { value: '3ro "B"', label: '3ro "B"' },
  { value: '3ro "C"', label: '3ro "C"' },
  { value: '4to "A"', label: '4to "A"' },
  { value: '4to "B"', label: '4to "B"' },
  { value: '5to "A"', label: '5to "A"' },
  { value: '5to "B"', label: '5to "B"' },
];

export const SelectSeccion = ({ onChange, value }: { onChange: (value: string) => void; value: string }) => {
    const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between"
        >
          {value
            ? Secciones.find((section) => section.value === value)?.label
            : "Seleccione la sección"}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder="Buscar Sección..." />
          <CommandList>
            <CommandEmpty>No se encontró la sección.</CommandEmpty>
            <CommandGroup>
              {Secciones.map((section) => (
                <CommandItem
                  key={section.value}
                  value={section.value}
                  onSelect={(currentValue) => {
                    onChange(currentValue === value ? "" : currentValue);
                    setOpen(false);
                  }}
                >
                  {section.label}
                  <Check
                    className={cn(
                      "ml-auto",
                      value === section.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
