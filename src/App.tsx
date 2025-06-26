import { useState, useEffect } from "react";
import { HashRouter, Routes, Route } from "react-router-dom";
import { BudgetProvider } from "./context/BudgetContext";
import { LoginProvider } from "./context/LoginContext";
import { useLogin } from "./hooks/use-login";
import { getProducts } from "./services/googleSheetsService";

import { Header } from "./components/header";
import { PrivateRoute } from "./components/private-route";
import LoadingScreen from "./pages/loadingScreen/loadingScreen";
import { Login } from "./pages/login";
import { BudgetForm } from "./pages/budget-form";
import { AddressForm } from "./pages/address-form";
import { Chats } from "./pages/chats";
import { Toaster } from "react-hot-toast";

function AppContent() {
  const { token } = useLogin();
  // Começamos com 'false'. Não estamos sincronizando até termos um token.
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // A lógica só é acionada quando o token existir.
    if (token) {
      // Assim que temos um token, ativamos o estado de sincronização.
      // Isso força uma re-renderização que irá mostrar a tela de loading.
      setIsSyncing(true);

      async function initializeApp() {
        try {
          // O await aqui vai esperar o tempo que for necessário
          // na primeira sincronização.
          await getProducts();
        } catch (error) {
          console.error("Falha na sincronização inicial:", error);
          // Adicione um toast de erro se desejar
        } finally {
          // Ao final de tudo (sucesso ou erro), desliga o estado de sincronização.
          setIsSyncing(false);
        }
      }
      
      initializeApp();
    }
  }, [token]);

  // A condição de renderização agora é mais simples e robusta.
  // Se 'isSyncing' for true, a tela de loading será mostrada.
  if (isSyncing) {
    return <LoadingScreen />;
  }

  return (
    <div className="w-[450px] h-[610px] bg-night-navy-blue p-6 flex flex-col gap-5">
      <Header />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<PrivateRoute><BudgetForm /></PrivateRoute>} />
        <Route path="/address" element={<PrivateRoute><AddressForm /></PrivateRoute>} />
        <Route path="/chats" element={<PrivateRoute><Chats /></PrivateRoute>} />
      </Routes>
      <Toaster position="top-right" toastOptions={{ duration: 4000, style: { background: "#333", color: "#fff" } }} />
    </div>
  );
}

function App() {
  return (
    <HashRouter>
      <LoginProvider>
        <BudgetProvider>
          <AppContent />
        </BudgetProvider>
      </LoginProvider>
    </HashRouter>
  );
}

export default App;