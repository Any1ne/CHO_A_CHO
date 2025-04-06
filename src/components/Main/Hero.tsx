"use client";

import { Button } from "../ui/button";
import { useState } from "react";
import RequestModal from "../Main/Request/RequestModal";

export default function Hero() {
  const [isRequestOpen, setIsRequestOpen] = useState(false);

  return (
    <section className="box flex justify-center items-center p-10">
      <Button onClick={() => setIsRequestOpen(true)}>Leave Request</Button>

      {isRequestOpen && (
        <RequestModal onClose={() => setIsRequestOpen(false)} />
      )}
    </section>
  );
}
