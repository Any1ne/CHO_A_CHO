import Menu from "./Menu";
import Logo from "./Logo";
import Basket from "./Basket";

export default function Header() {
  return (
    <header className="grid grid-cols-3 grid-rows-2 gap-4 border-2 p-4">
      <Menu />
      <Logo />
      <Basket />
    </header>
  );
}
