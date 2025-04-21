import Menu from "./Menu";
import Logo from "./Logo";
import Control from "./Control";
import MobileMenuButton from "../Mobile/Menu/MobileMenuButton";

export default function Header() {
  return (
    <header className="box py-2  md:px-10 h-[15vh] fixed top-0 left-0 right-0 bg-white z-50">
      {/* Desktop layout */}
      <div className="hidden md:grid grid-rows-[5vh_6vh] grid-cols-[1fr_minmax(160px,auto)_1fr] items-end gap-[1vh] m-1">
        <Menu />
        <Logo />
        <Control />
      </div>

      {/* Mobile layout */}
      <div className="md:hidden grid grid-rows-[4vh_6vh] grid-cols-[1fr_minmax(160px,auto)_1fr] items-end gap-[1vh] m-1">
        <MobileMenuButton />
        <Logo />
        <Control />
      </div>
    </header>
  );
}
