import axios from "axios";

interface TokenResponse {
  access_token: string;
}

interface SheetResponse {
  values: string[][];
}

interface ProductInfo {
  codigoProduto: string;
  nomeProduto: string;
  valorVenda: number;
  estoque: number;
}

export interface Budget {
  productName: string;
  productCode: number;
  quantity: number;
  price: number;
  discount: number;
  total: number;
  hasDelivery: "Sim" | "Não";
  cep?: string;
  neighborhood?: string;
  street?: string;
  number?: string;
  city?: string;
  state?: string;
  clientName: string;
  chatId: number;
  paymentMethod: string;
}

const SHEET_COLUMNS = {
  COD_PROD: 0,
  NOME_PROD: 4,
  ESTOQUE: 19,
  VALOR_VENDA: 24,
};

export async function fetchToken(): Promise<string> {
  const payload = {
    client_secret: import.meta.env.VITE_CLIENT_SECRET,
    grant_type: "refresh_token",
    refresh_token: import.meta.env.VITE_REFRESH_TOKEN,
    client_id: import.meta.env.VITE_CLIENT_ID,
  };

  const response = await axios.post<TokenResponse>(
    "https://oauth2.googleapis.com/token",
    payload
  );

  return response.data.access_token;
}

export async function fetchSheetData(accessToken: string): Promise<string[][]> {
  const response = await axios.get<SheetResponse>(
    `https://sheets.googleapis.com/v4/spreadsheets/${
      import.meta.env.VITE_STORAGE_SPREADSHEET_ID
    }/values/A2:AJ`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  return response.data.values;
}

export function processSheetData(data: string[][]): ProductInfo[] {
  return data.map((row) => ({
    codigoProduto: row[SHEET_COLUMNS.COD_PROD],
    nomeProduto: row[SHEET_COLUMNS.NOME_PROD],
    valorVenda: parseFloat(row[SHEET_COLUMNS.VALOR_VENDA]),
    estoque: parseInt(row[SHEET_COLUMNS.ESTOQUE], 10),
  }));
}

export async function sendToGoogleSheets(budgetItems: Budget[]) {
  const accessToken = await fetchToken();

  const range = "Página1!A1";

  const values = budgetItems.map((data) => [
    new Date().getTime() + data.chatId,
    data.productCode,
    data.productName,
    data.quantity,
    data.price,
    data.discount,
    data.total,
    data.clientName,
    data.hasDelivery,
    data.cep || "N/A",
    data.street || "N/A",
    data.number || "N/A",
    data.neighborhood || "N/A",
    data.city || "N/A",
    data.state || "N/A",
    data.paymentMethod,
  ]);

  const body = {
    values: values,
  };

  const response = await axios.post(
    `https://sheets.googleapis.com/v4/spreadsheets/${
      import.meta.env.VITE_BUDGETS_SPREADSHEET_ID
    }/values/${range}:append?valueInputOption=USER_ENTERED`,
    body,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (response.status !== 200) {
    throw new Error("Failed to send data to Google Sheets");
  }

  return response.data;
}
