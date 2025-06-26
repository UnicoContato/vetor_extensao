import { LogOut } from "lucide-react";
import logo from "/src/assets/logo.png";
import { useLogin } from "@/hooks/use-login";
import { useLocation } from "react-router-dom";

export function Header() {
  const { logout } = useLogin();
  const location = useLocation();

  const isLoginPage = location.pathname === "/login";

  return (
    <header className="flex items-center justify-between pr-5">
      <img src={logo} alt="Logo Único Contato" className="w-52" />
      {!isLoginPage && (
        <button
          className="p-2 hover:bg-zinc-800/50 hover:text-accent-foreground rounded-md"
          onClick={logout}
        >
          <LogOut color="white" />
        </button>
      )}
    </header>
  );
}
