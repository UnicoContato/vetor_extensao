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
  hasDelivery: boolean;
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
  neighborhood: string;
}

// ===================================================================
// --- INÍCIO DA SEÇÃO MODIFICADA ---
// ===================================================================

/**
 * MODIFICADO: Busca produtos da nova API Zetti.
 * https://integracao.zetti.dev/api/ecommerce/produtos/consulta
 */
async function fetchProductsFromApi(): Promise<ProductInfo[]> {
  // 1. Defina a nova URL base da API
  const API_BASE_URL = 'https://integracao.zetti.dev';

  // Para desenvolvimento local, você pode usar um proxy em seu vite.config.ts
  // Ex: /api-zetti -> https://integracao.zetti.dev
  const API_URL =
    window.location.protocol === 'chrome-extension:'
      ? API_BASE_URL
      : '/api-zetti'; // Usar um novo caminho de proxy é uma boa prática

  try {
    eventBus.emit('loading:status', 'Conectando à API de produtos...');

    // 2. Faz a chamada para o novo endpoint
    const response = await axios.get(
      `${API_URL}/api/ecommerce/produtos/consulta`,
      {
        // 3. Remove os parâmetros de paginação antigos
        // 4. Atualiza o cabeçalho de autorização
        headers: {
          Authorization: `ApiKey ${import.meta.env.VITE_CLIENT_TOKEN}`,
        },
      },
    );

    // 5. Acessa o array de produtos na estrutura de resposta aninhada
    const apiProducts = response.data?.data;

    if (!apiProducts || !Array.isArray(apiProducts)) {
      console.error(
        'A resposta da API não contém um array de produtos no formato esperado.',
        response.data,
      );
      eventBus.emit(
        'loading:status',
        'Erro: Formato de dados inesperado recebido da API.',
      );
      return []; // Retorna um array vazio para não quebrar a aplicação
    }

const allProducts: ProductInfo[] = apiProducts
  .filter((product: any) => product.cdProduto != null) 
  .map((product: any) => ({
    codigo: product.cdProduto,
    nome: product.descricao,
    valorVenda: product.vlrTabela,
    quantidadeEstoque: product.qtdEstoque,
  }));

    eventBus.emit(
      'loading:status',
      `${allProducts.length.toLocaleString('pt-BR')} produtos carregados...`,
    );

    return allProducts;
  } catch (error) {
    console.error('Erro ao buscar produtos da API Zetti:', error);
    eventBus.emit(
      'loading:status',
      `Erro ao buscar dados. Verifique a conexão e a configuração da API.`,
    );
    throw error;
  }
}

// ===================================================================
// --- FIM DA SEÇÃO MODIFICADA ---
// ===================================================================

export async function forceSync() {
  eventBus.emit('loading:status', 'Buscando dados na API...');
  // Nenhuma alteração aqui, ele já usa a nova fetchProductsFromApi
  const products = await fetchProductsFromApi();

  if (products.length > 0) {
    eventBus.emit('loading:status', 'Gravando produtos no cache local...');
    await saveProductsToCache(products);
    eventBus.emit('loading:status', 'Sincronização concluída!');
  }
  return products;
}

// --- Funções getProducts e de envio para o Google Sheets (sem alterações) ---
// O restante do arquivo pode continuar exatamente como está.

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
    const subtotalComDesconto = subtotal * (1 - value.valorDesconto / 100);
    return total + subtotalComDesconto;
  }, 0);

  const primeiroItem = budgetItems[0];
  if (!primeiroItem) {
    console.error('sendToGoogleSheets chamada com array vazio.');
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
    entrega: isDelivery ? 'Sim' : 'Não', // Enviando como String ("Sim"/"Não")
    cliente: {
      codigo: '',
      nome: primeiroItem.clientName || '',
      // O campo numeroCpfCnpj foi removido temporariamente para o teste
      numeroRGIE: '',
      sexo: '',
      dataNascimento: '',
      celular: '',
      fone: '',
      email: '',
    },
    enderecoEntrega: {
      logradouro: primeiroItem.street || 'Retirada em loja',
      numero: primeiroItem.number || 'S/N',
      complemento: '',
      referencia: '',
      bairro: primeiroItem.neighborhood || 'Loja',
      cidade: primeiroItem.city || 'N/A',
      estado: primeiroItem.state || 'N/A',
      cep: primeiroItem.cep || '00000000',
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
        Authorization: `ApiKey ${import.meta.env.VITE_CLIENT_TOKEN}`,
      },
    },
  );

  if (response.status !== 200 && response.status !== 204) {
    throw new Error('Failed to send data to API');
  }

  return response.data;
}
