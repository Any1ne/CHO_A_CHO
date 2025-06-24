import Menu from "./Menu";
import Logo from "./Logo";
import Control from "./Control";
import Contacts from "./Contacts";
import Topbar from "./Topbar";
import MobileMenuButton from "../Mobile/Menu/MobileMenuButton";

export default function Header() {
  return (
    <div className="flex flex-col
    fixed top-0 left-0 right-0 z-50
    max-h-[8rem]
    md:max-h-[10rem]
    max-w-[100vw]
    ">
      <Topbar />

      {/* Header main row */}
      <header className="bg-primary w-full py-2 px-4 md:pl-10 lg:pl-20 rounded-b-lg">
        {/* Desktop layout */}
        <div className="hidden md:flex w-full h-full justify-between gap-20 ">
          <Logo />
          <div className="grow flex flex-col justify-between">
                  {/* Contacts block */}
            <div>
              <Contacts />
            </div>
            <div className="flex h-[2.5rem] justify-between pr-20 items-end" >
              <Menu />
              <Control /></div>
          </div>
        </div>

        {/* Mobile layout */}
        <div className="md:hidden flex justify-between w-full items-center py-1">
          <MobileMenuButton />
            <div className="absolute left-1/2 transform -translate-x-1/2">
    <Logo />
  </div>
          <Control />
        </div>
      </header>
    </div>
  );
}
