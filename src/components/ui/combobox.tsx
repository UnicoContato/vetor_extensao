import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { debounce } from "lodash";

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
import {
  fetchSheetData,
  fetchToken,
  processSheetData,
} from "@/services/googleSheetsService";

interface ProductInfo {
  codigoProduto: string;
  nomeProduto: string;
  valorVenda: number;
  estoque: number;
}

interface ComboboxProps {
  onProductSelect: (product: ProductInfo | null) => void;
}

export function Combobox({ onProductSelect }: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [allProdutos, setAllProdutos] = useState<ProductInfo[]>([]);
  const [filteredProdutos, setFilteredProdutos] = useState<ProductInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const convertMoeda = useCallback((valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const accessToken = await fetchToken();
        const sheetData = await fetchSheetData(accessToken);
        const processedData = processSheetData(sheetData);
        setAllProdutos(processedData);
      } catch (error) {
        console.error("Erro:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const searchProducts = useCallback(
    (term: string) => {
      if (!term) {
        setFilteredProdutos([]);
        return;
      }
      const filtered = allProdutos.filter(
        (produto) =>
          produto.nomeProduto.toLowerCase().includes(term.toLowerCase()) ||
          produto.codigoProduto.includes(term)
      );
      setFilteredProdutos(filtered.slice(0, 100));
    },
    [allProdutos]
  );

  const debouncedSearch = useMemo(
    () => debounce(searchProducts, 300),
    [searchProducts]
  );

  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  useEffect(() => {
    debouncedSearch(searchTerm);
  }, [searchTerm, debouncedSearch]);

  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
  };

  const selectedProduct = allProdutos.find((p) => p.nomeProduto === value);

  const handleSelect = useCallback(
    (currentValue: string) => {
      const selectedProduct = allProdutos.find(
        (p) => p.nomeProduto === currentValue
      );
      setValue(currentValue === value ? "" : currentValue);
      setOpen(false);
      onProductSelect(selectedProduct || null);
    },
    [allProdutos, value, onProductSelect]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="combobox"
          role="combobox"
          aria-expanded={open}
          className="justify-between bg-zinc-300 border-zinc-400 hover:bg-zinc-300/90 hover:text-zinc-800"
        >
          <span className="truncate">
            {selectedProduct
              ? `${selectedProduct.nomeProduto} - ${convertMoeda(
                  selectedProduct.valorVenda
                )}`
              : "Selecione um produto..."}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0">
        <Command>
          <CommandInput
            placeholder="Procurar produto..."
            value={searchTerm}
            onValueChange={handleSearchChange}
          />
          <CommandList>
            <CommandEmpty>Nenhum produto encontrado.</CommandEmpty>
            <CommandGroup>
              {isLoading ? (
                <CommandItem>Carregando...</CommandItem>
              ) : (
                filteredProdutos.map((produto) => (
                  <CommandItem
                    key={produto.codigoProduto}
                    value={produto.nomeProduto}
                    onSelect={handleSelect}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === produto.nomeProduto
                          ? "opacity-100"
                          : "opacity-0"
                      )}
                    />
                    {produto.nomeProduto} - {convertMoeda(produto.valorVenda)}
                  </CommandItem>
                ))
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
