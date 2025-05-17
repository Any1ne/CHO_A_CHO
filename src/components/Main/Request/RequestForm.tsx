"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { sendContactRequest } from "@/lib/api";

export default function RequestForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await sendContactRequest(form);
      toast.success("Запит надіслано! Ми зв'яжемося з вами найближчим часом.");
      setForm({ name: "", email: "", message: "" });

      setTimeout(() => {
        router.push("/");
      }, 2000);
    } catch (error: any) {
      toast.error(error.message || "Помилка надсилання запиту");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <input
        type="text"
        name="name"
        placeholder="Ваше імʼя"
        value={form.name}
        onChange={handleChange}
        className="w-full border p-2 rounded"
      />
      <input
        type="email"
        name="email"
        placeholder="Ваш email"
        value={form.email}
        onChange={handleChange}
        className="w-full border p-2 rounded"
      />
      <textarea
        name="message"
        placeholder="Ваше повідомлення"
        value={form.message}
        onChange={handleChange}
        className="w-full border p-2 rounded h-24"
      />
      <Button type="submit" className="w-full">
        Надіслати запит
      </Button>
    </form>
  );
}
