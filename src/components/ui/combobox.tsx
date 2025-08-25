import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { debounce } from 'lodash';
import { ProductInfo } from '@/services/googleSheetsService';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface ComboboxProps {
  products: ProductInfo[];
  isLoading: boolean;
  onProductSelect: (product: ProductInfo | null) => void;
}

export function Combobox({
  products = [],
  isLoading,
  onProductSelect,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProdutos, setFilteredProdutos] = useState<ProductInfo[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const convertMoeda = useCallback((valor: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  }, []);

  useEffect(() => {
    setFilteredProdutos(products.slice(0, 100));
  }, [products]);

  const searchProducts = useCallback(
    (term: string) => {
      if (!term) {
        setFilteredProdutos(products.slice(0, 100));
        setIsSearching(false);
        return;
      }

      const filtered = products.filter(
        (produto) =>
          produto.nome.toLowerCase().includes(term.toLowerCase()) ||
          produto.codigo.toString().includes(term),
      );
      setFilteredProdutos(filtered.slice(0, 100));
      setIsSearching(false);
    },
    [products],
  );

  const debouncedSearch = useMemo(
    () => debounce(searchProducts, 300),
    [searchProducts],
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
    setIsSearching(true);
  };

  const selectedProduct = products.find((p) => p.nome === value);

  const handleSelect = useCallback(
    (currentValue: string) => {
      const selected = products.find(
        (p) => p.nome.toLowerCase() === currentValue.toLowerCase(),
      );
      setValue(currentValue === value ? '' : currentValue);
      setOpen(false);
      onProductSelect(selected || null);
    },
    [products, value, onProductSelect],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="combobox"
          role="combobox"
          aria-expanded={open}
          className="justify-between bg-zinc-300 border-zinc-400 hover:bg-zinc-300/90 hover:text-zinc-800"
          disabled={isLoading}
        >
          <span className="truncate">
            {isLoading
              ? 'Carregando...'
              : selectedProduct
              ? `${selectedProduct.nome} - ${convertMoeda(
                  selectedProduct.valorVenda,
                )}`
              : 'Selecione um produto...'}
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
            {isLoading ? (
              <CommandItem disabled>Carregando...</CommandItem>
            ) : isSearching ? (
              <CommandItem disabled>Procurando...</CommandItem>
            ) : (
              <>
                <CommandEmpty>Nenhum produto encontrado.</CommandEmpty>
                <CommandGroup>
                  {filteredProdutos.map((produto) => (
                    <CommandItem
                      key={produto.codigo} 
                      value={produto.nome}
                      onSelect={handleSelect}
                    >
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4',
                          value === produto.nome ? 'opacity-100' : 'opacity-0',
                        )}
                      />
                      {produto.nome} - {convertMoeda(produto.valorVenda)}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
