import Link from "next/link";
import { Button } from "../ui/button";

export default function Gateway() {
  return (
    <div className="box h-100 space-x-4 flex justify-center items-center">
      <Link href="/store">
        <Button> Go to Store</Button>
      </Link>
      <Link href="/branded">
        <Button> Branded offer</Button>
      </Link>
    </div>
  );
}
