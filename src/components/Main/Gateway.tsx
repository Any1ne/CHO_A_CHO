import Link from "next/link";
import { Button } from "../ui/button";

export default function Gateway() {
  return (
    <div className="box flex justify-center space-x-4 p-4">
      <Link href="/store">
        <Button> Go to Store</Button>
      </Link>
      <Link href="/request">
        <Button> Leave Request</Button>
      </Link>
    </div>
  );
}
