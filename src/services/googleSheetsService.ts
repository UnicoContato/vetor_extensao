import axios from 'axios';
import {
  getProductsFromCache,
  isCacheEmpty,
  saveProductsToCache,
} from '@/cache/productCache';
import { eventBus } from '@/lib/event-bus';

// --- Interfaces (sem alterações) ---
export interface ProductInfo {
  codigo: number;
  nome: string;
  valorVenda: number;
  quantidadeEstoque: number;
}
export interface Budget {
  productName: string;
  productCode: number;
  quantity: number;
  price: number;
  discount: number;
  total: number;
  hasDelivery: boolean; // Mantemos booleano aqui, a conversão é feita no envio
  cep?: string;
  street?: string;
  number?: string;
  city?: string;
  state?: string;
  clientName: string;
  chatId: number;
  paymentMethod: string;
  taxEntrega?: string;
  cpfClient: string;
  neighborhood:string;
}

// --- Funções de baixo nível e getProducts (sem alterações) ---
// O código de fetchProductsFromApi, forceSync e getProducts continua o mesmo da versão anterior.
// ... (cole aqui as funções fetchProductsFromApi, forceSync, e getProducts da nossa última versão)

async function fetchProductsFromApi(): Promise<ProductInfo[]> {
  const API_BASE_URL =
    window.location.protocol === 'chrome-extension:'
      ? 'https://api-sgf-gateway.triersistemas.com.br'
      : '/api';

  let allProducts: ProductInfo[] = [];
  let primeiroRegistro = 1;
  const quantidadeRegistros = 999;

  while (true) {
    try {
      const response = await axios.get<ProductInfo[]>(
        `${API_BASE_URL}/sgfpod1/rest/integracao/produto/obter-v1`,
        {
          params: {
            primeiroRegistro,
            quantidadeRegistros,
            ativo: true,
            integracaoEcommerce: true,
          },
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_CLIENT_TOKEN}`,
          },
        },
      );

      if (!response.data || response.data.length === 0) break;

      allProducts = allProducts.concat(response.data);
      primeiroRegistro += quantidadeRegistros;

      eventBus.emit(
        'loading:status',
        `${allProducts.length.toLocaleString('pt-BR')} produtos carregados...`,
      );
    } catch (error) {
      eventBus.emit(
        'loading:status',
        `Erro ao buscar dados. Verifique a conexão.`,
      );
      throw error;
    }
  }
  return allProducts;
}

export async function forceSync() {
  eventBus.emit('loading:status', 'Buscando dados na API...');
  const products = await fetchProductsFromApi();

  if (products.length > 0) {
    eventBus.emit('loading:status', 'Gravando produtos no cache local...');
    await saveProductsToCache(products);
    eventBus.emit('loading:status', 'Sincronização concluída!');
  }
  return products;
}

let initialSyncPromise: Promise<ProductInfo[]> | null = null;
let lastRevalidationTimestamp: number | null = null;
const REVALIDATION_INTERVAL = 1000 * 60 * 30; // 30 minutos

export async function getProducts(): Promise<ProductInfo[]> {
  if (initialSyncPromise) {
    return initialSyncPromise;
  }

  const cacheIsEmpty = await isCacheEmpty();

  if (cacheIsEmpty) {
    initialSyncPromise = forceSync();
    return initialSyncPromise;
  }

  const now = Date.now();
  if (!lastRevalidationTimestamp) {
    lastRevalidationTimestamp = now;
  }

  const shouldRevalidate =
    now - lastRevalidationTimestamp > REVALIDATION_INTERVAL;

  if (shouldRevalidate && navigator.onLine) {
    lastRevalidationTimestamp = now;
    forceSync().catch((error) => {
      console.error(
        'REVALIDAÇÃO SILENCIOSA: Falha ao atualizar o cache.',
        error,
      );
      lastRevalidationTimestamp = null;
    });
  }

  return getProductsFromCache();
}


// --- A FUNÇÃO DE ENVIO CORRIGIDA E SIMPLIFICADA ---

export async function sendToGoogleSheets(budgetItems: Budget[]) {
  // Mapeia para a estrutura de produtos que a API espera
  const produtos = budgetItems.map((data) => ({
    codigoProduto: parseInt(data.productCode.toString(), 10), // Força a ser um número, como na versão antiga
    nomeProduto: data.productName,
    quantidade: data.quantity,
    valorUnitario: data.price,
    valorDesconto: data.discount,
  }));

  const valorTotal = produtos.reduce((total, value) => {
    const subtotal = value.quantidade * value.valorUnitario;
    const subtotalComDesconto = subtotal * (1 - (value.valorDesconto / 100));
    return total + subtotalComDesconto;
  }, 0);

  const primeiroItem = budgetItems[0];
  if (!primeiroItem) {
    console.error("sendToGoogleSheets chamada com array vazio.");
    return;
  }

  const numeroPedido = new Date().getTime() + primeiroItem.chatId;
  const isDelivery = primeiroItem.hasDelivery;

  // Montando o corpo da requisição para ser o mais parecido possível com a versão funcional
  const body = {
    numeroPedido: numeroPedido,
    dataPedido: new Date().toISOString().split('T')[0],
    valorTotalVenda: valorTotal,
    // O campo valorFrete foi removido temporariamente para o teste
    entrega: isDelivery ? "Sim" : "Não", // Enviando como String ("Sim"/"Não")
    cliente: {
      codigo: "",
      nome: primeiroItem.clientName || "",
      // O campo numeroCpfCnpj foi removido temporariamente para o teste
      numeroRGIE: "",
      sexo: "",
      dataNascimento: "",
      celular: "",
      fone: "",
      email: "",
    },
    enderecoEntrega: {
      logradouro: primeiroItem.street || "Retirada em loja",
      numero: primeiroItem.number || "S/N",
      complemento: "",
      referencia: "",
      bairro: primeiroItem.neighborhood || "Loja",
      cidade: primeiroItem.city || "N/A",
      estado: primeiroItem.state || "N/A",
      cep: primeiroItem.cep || "00000000",
    },
    pagamento: {
      pagamentoRealizado: false,
      valorParcela: valorTotal,
      dataVencimento: null,
      valorDinheiro: null,
      valorTroco: null,
      numeroAutorizacao: null,
    },
    produtos: produtos,
  };

  const response = await axios.post(
    `http://demo.triersistemas.com.br:4647/sgfpod1/rest/integracao/venda/ecommerce/efetuar-venda-v1`,
    body,
    {
      headers: {
        Authorization: `Bearer eyJhbGciOiJIzI1NiJ9.eyJjb2RfZmlsaWFsIjoiOTkiLCJzY29wZSI6WyJkcm9nYXJpYSJdLCJ0b2tlbl9pbnRlZ3JhY2FvIjoidHJ1ZSIsImNvZF9mYXJtYWNpYSI6IjMwODgiLCJleHAiOjQxMDI0NTU2MDAsImlhdCI6MTcwOTgxNzE5OCwianRpIjoiZjA1N2IwOTYtNjFhOC00MGFhLWJkOGUtMWI4ZGYzNjZlNmEzIiwiY29kX3VzdWFyaW8iOiI0NiIsImF1dGhvcml0aWVzIjpbIkFQSV9JTlRFR1JBQ0FPIl19.b9D3oUNeVa0Z28mYhEuBwPQ_RhcQWIEogHJdRYun77g`,
      },
    }
  );

  if (response.status !== 200 && response.status !== 204) {
    throw new Error('Failed to send data to API');
  }

  return response.data;
}