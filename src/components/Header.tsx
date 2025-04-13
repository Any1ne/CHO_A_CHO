import Menu from "./Header/Menu";
import Logo from "./Header/Logo";
import Control from "./Header/Control";
import MobileMenuButton from "./Mobile/Menu/MobileMenuButton";

export default function Header() {
  return (
    <header className="box border-2 relative px-4 py-2 bg-white">
      {/* Desktop layout */}
      <div className="hidden md:grid grid-rows-2 grid-cols-3 items-end gap-4 h-30">
        <Menu />
        <Logo />
        <Control />
      </div>

      {/* Mobile layout */}
      <div className="md:hidden flex flex-col">
        <div className="flex justify-between items-center h-16">
          <MobileMenuButton />
          <Logo />
          <Control />
        </div>
      </div>
    </header>
  );
}
