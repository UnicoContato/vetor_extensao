import { AddressForm } from "./pages/address-form";
import { BudgetForm } from "./pages/budget-form";
import { Header } from "./components/header";
import { Routes, Route } from "react-router-dom";
import { HashRouter } from "react-router-dom";
import { BudgetProvider } from "./context/BudgetContext";
import { Login } from "./pages/login";
import { LoginProvider } from "./context/LoginContext";
import { Chats } from "./pages/chats";
import { PrivateRoute } from "./components/private-route";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <div className="bg-night-navy-blue p-6 flex flex-col gap-5">
      <Header />
      <HashRouter>
        <LoginProvider>
          <BudgetProvider>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <BudgetForm />
                  </PrivateRoute>
                }
              />
              <Route
                path="/address"
                element={
                  <PrivateRoute>
                    <AddressForm />
                  </PrivateRoute>
                }
              />
              <Route
                path="/chats"
                element={
                  <PrivateRoute>
                    <Chats />
                  </PrivateRoute>
                }
              />
            </Routes>
            <Toaster
              position="top-right"
              toastOptions={{
                // Configurações padrão para todos os toasts
                duration: 4000,
                style: {
                  background: "#333",
                  color: "#fff",
                },
                // Opções específicas para diferentes tipos de toast
                success: {
                  style: {
                    background: "#4CAF50",
                    color: "#fff",
                  },
                },
                error: {
                  style: {
                    background: "#F44336",
                    color: "#fff",
                  },
                },
              }}
            />
          </BudgetProvider>
        </LoginProvider>
      </HashRouter>
    </div>
  );
}

export default App;
