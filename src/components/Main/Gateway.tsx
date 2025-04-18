import Link from "next/link";
import { Button } from "../ui/button";

export default function Gateway() {
  return (
    <div className="box h-[90vh] space-x-4 flex justify-end items-center box-border">
      <div className="box w-[50%] h-full space-x-4 flex justify-center items-center" >
      <Link className="" 
      href="/store">
        <Button> Go to Store</Button>
      </Link>
      <Link className="" 
      href="/branded">
        <Button> Branded offer</Button>
      </Link>
      </div>
    </div>
  );
}
