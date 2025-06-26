import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { getProducts, type ProductInfo } from '@/services/googleSheetsService';

interface ComboboxProps {
  onProductSelect: (product: ProductInfo | null) => void;
}

export function Combobox({ onProductSelect }: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [allProducts, setAllProducts] = useState<ProductInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadProducts() {
      try {
        setIsLoading(true);
        const products = await getProducts();
        setAllProducts(products);
      } catch (error) {
        console.error("Erro ao carregar produtos para o combobox:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadProducts();
  }, []);

  const handleSelect = (currentValue: string) => {
    const selected = allProducts.find(p => p.nome.toLowerCase() === currentValue.toLowerCase());
    if (selected) {
      setValue(selected.nome);
      onProductSelect(selected);
    } else {
      setValue('');
      onProductSelect(null);
    }
    setOpen(false);
  };
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
          {value || "Selecione um produto..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command>
          <CommandInput placeholder="Buscar produto..." />
          <CommandList>
            {isLoading && <CommandEmpty>Carregando lista de produtos...</CommandEmpty>}
            {!isLoading && <CommandEmpty>Nenhum produto encontrado.</CommandEmpty>}
            <CommandGroup>
              {allProducts.slice(0, 100).map((product) => (
                <CommandItem key={product.codigo} value={product.nome} onSelect={handleSelect}>
                  <Check className={cn("mr-2 h-4 w-4", value.toLowerCase() === product.nome.toLowerCase() ? "opacity-100" : "opacity-0")} />
                  {product.nome}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}