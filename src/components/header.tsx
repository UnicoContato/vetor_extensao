import logo from "/src/assets/logo.png";

export function Header() {
  return (
    <header className="flex items-center">
      <img src={logo} alt="Logo Único Contato" className="w-52" />
    </header>
  );
}
