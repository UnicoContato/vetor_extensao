import type { Budget } from "@/services/googleSheetsService";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AddressInfo {
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  cep?: string;
}

interface PaymentMethodData {
  paymentMethod: "Pix" | "Crédito" | "Débito";
}

export function formatBudgetMessage(
  budgetItems: Budget[],
  addressInfo: AddressInfo | null,
  data: PaymentMethodData
): string {
  let message = `\n\n📋 *Orçamento*\n\n`;

  if (addressInfo) {
    message += `🏠 *Endereço de Entrega:*\n`;
    message += `${addressInfo.street || "Não informado"}, ${
      addressInfo.number || "S/N"
    }\n`;
    message += `${addressInfo.neighborhood || "Não informado"}\n`;
    message += `${addressInfo.city || "Não informado"} - ${
      addressInfo.state || "Não informado"
    }\n`;
    message += `CEP: ${addressInfo.cep || "Não informado"}\n\n`;
  }

  // Detalhes dos produtos
  message += `🛍️ *Itens do Orçamento:*\n`;

  let totalGeral = 0;
  budgetItems.forEach((item, index) => {
    message += `\n*${index + 1}. ${item.productName}*\n`;
    message += `Quantidade: ${item.quantity}\n`;
    message += `Preço Unitário: R$ ${item.price.toFixed(2)}\n`;

    // Cálculo de desconto
    const descontoValor = item.price * (item.discount / 100);

    message += `Desconto: ${item.discount}% (R$ ${descontoValor.toFixed(2)})\n`;
    message += `Subtotal: R$ ${item.total.toFixed(2)}\n`;

    totalGeral += item.total;
  });

  // Resumo final
  message += `\n💰 *Resumo:*\n`;
  message += `Total Geral: R$ ${totalGeral.toFixed(2)}\n`;
  message += `Método de Pagamento: ${data.paymentMethod}\n`;
  message += `Entrega: ${
    budgetItems[0].hasDelivery === "Sim" ? "Com Entrega" : "Sem Entrega"
  }`;

  return message;
}
