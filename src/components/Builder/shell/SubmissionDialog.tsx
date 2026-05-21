// src/components/Builder/shell/SubmissionDialog.tsx
//
// Order-submission dialog. Triggered by TopBar "Надіслати запит" once
// the buyer is in the design stage. The top of the dialog is laid out
// like a shopping-cart line item: preview thumbnail + shape / flavor /
// quantity stepper + live price. The form below collects contact info;
// the parent handles export, upload, and the API POST.
//
// Phase 32 Subtask 1: dialog now hosts a `success` state. When the
// parent flips `submissionSucceeded` true, the dialog replaces the
// form with a celebratory summary + two CTAs: start a fresh design
// (clears canvas + draft) or close (keeps the buyer on the current
// design surface; localStorage draft was already cleared by the
// parent's submit handler).

"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import {
  CheckCircle2,
  ImageIcon,
  Loader2,
  Plus,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import QtyStepper from "./QtyStepper";

const MIN_QTY = 100;
const MAX_QTY = 10000;

export interface SubmissionFormValues {
  name: string;
  email: string;
  phone: string;
  company?: string;
  notes?: string;
}

export interface SubmissionDialogProps {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  /** Object URL for the freshly-exported mockup preview. null while
   *  loading or if the export failed. */
  previewUrl: string | null;
  shapeName: string;
  flavorName: string;
  quantity: number;
  onQuantityChange: (next: number) => void;
  unitPriceCurrent: number | null;
  totalPrice: number | null;
  isSubmitting: boolean;
  /** Phase 32 Subtask 1: parent flips this to true after a successful
   *  POST. Dialog swaps to a success screen until the buyer dismisses
   *  it or starts a fresh design. */
  submissionSucceeded: boolean;
  /** Customer email displayed back in the success summary. Falls back
   *  gracefully if the parent doesn't surface it. */
  submittedEmail?: string;
  /** Resolves once the parent has finished export + upload + API POST. */
  onSubmit: (values: SubmissionFormValues) => Promise<void>;
  /** Phase 32 Subtask 1: parent action that wipes canvas + draft +
   *  returns to setup. Triggered from the success-screen primary CTA. */
  onNewDesign: () => void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+0-9\s\-()]{7,}$/;

function formatUah(n: number): string {
  return `${Math.round(n).toLocaleString("uk-UA")} ₴`;
}

export default function SubmissionDialog({
  open,
  onOpenChange,
  previewUrl,
  shapeName,
  flavorName,
  quantity,
  onQuantityChange,
  unitPriceCurrent,
  totalPrice,
  isSubmitting,
  submissionSucceeded,
  submittedEmail,
  onSubmit,
  onNewDesign,
}: SubmissionDialogProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  function validate(): string | null {
    if (name.trim().length < 2) return "Введіть імʼя.";
    if (!EMAIL_RE.test(email.trim())) return "Введіть коректний email.";
    if (!PHONE_RE.test(phone.trim())) return "Введіть коректний номер телефону.";
    return null;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    await onSubmit({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      company: company.trim() ? company.trim() : undefined,
      notes: notes.trim() ? notes.trim() : undefined,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="md">
        {submissionSucceeded ? (
          <SuccessScreen
            shapeName={shapeName}
            flavorName={flavorName}
            quantity={quantity}
            totalPrice={totalPrice}
            submittedEmail={submittedEmail ?? email}
            onNewDesign={onNewDesign}
            onClose={() => onOpenChange(false)}
          />
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Надіслати запит</DialogTitle>
              <DialogDescription>
                Ми зв&apos;яжемося з вами протягом дня для підтвердження.
              </DialogDescription>
            </DialogHeader>

            {/* Basket-item row: thumbnail + name + flavor + qty stepper + total. */}
            <div className="flex gap-3 rounded-lg border border-stone-200 bg-stone-50 p-3">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md border border-stone-200 bg-white">
                {previewUrl ? (
                  <Image
                    src={previewUrl}
                    alt={`${shapeName} — ${flavorName}`}
                    fill
                    sizes="80px"
                    unoptimized
                    className="object-contain"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-stone-300">
                    <ImageIcon className="h-6 w-6" />
                  </div>
                )}
              </div>

              <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-stone-900">
                    {shapeName}
                  </div>
                  {flavorName && flavorName !== shapeName && (
                    <div className="truncate text-xs text-stone-500">
                      {flavorName}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2">
                  <QtyStepper
                    value={quantity}
                    onChange={onQuantityChange}
                    min={MIN_QTY}
                    max={MAX_QTY}
                    variant="compact"
                  />
                  {totalPrice !== null && unitPriceCurrent !== null && (
                    <div className="text-right">
                      <div className="text-sm font-semibold tabular-nums text-stone-900">
                        {formatUah(totalPrice)}
                      </div>
                      <div className="text-[10px] tabular-nums text-stone-500">
                        {formatUah(unitPriceCurrent)} / шт
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <Field
                label="Імʼя"
                required
                value={name}
                onChange={setName}
                disabled={isSubmitting}
                autoComplete="name"
              />
              <Field
                label="Email"
                required
                type="email"
                value={email}
                onChange={setEmail}
                disabled={isSubmitting}
                autoComplete="email"
              />
              <Field
                label="Телефон"
                required
                type="tel"
                value={phone}
                onChange={setPhone}
                disabled={isSubmitting}
                autoComplete="tel"
                placeholder="+380…"
              />
              <Field
                label="Компанія"
                value={company}
                onChange={setCompany}
                disabled={isSubmitting}
                autoComplete="organization"
              />
              <FieldTextarea
                label="Примітки"
                value={notes}
                onChange={setNotes}
                disabled={isSubmitting}
                rows={3}
              />

              {error && <p className="text-xs text-red-600">{error}</p>}

              <div className="mt-2 flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isSubmitting}
                  className="flex-1 justify-center"
                >
                  Закрити
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 justify-center gap-2 bg-stone-900 text-white hover:bg-stone-800"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {isSubmitting ? "Надсилаємо…" : "Надіслати"}
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface SuccessScreenProps {
  shapeName: string;
  flavorName: string;
  quantity: number;
  totalPrice: number | null;
  submittedEmail: string;
  onNewDesign: () => void;
  onClose: () => void;
}

function SuccessScreen({
  shapeName,
  flavorName,
  quantity,
  totalPrice,
  submittedEmail,
  onNewDesign,
  onClose,
}: SuccessScreenProps) {
  const showFlavor = flavorName && flavorName !== shapeName;
  return (
    <div className="flex flex-col items-center gap-4 py-2 text-center">
      <div className="rounded-full bg-emerald-50 p-3">
        <CheckCircle2 className="h-10 w-10 text-emerald-600" strokeWidth={1.8} />
      </div>
      <div className="space-y-1.5">
        <h2 className="text-xl font-semibold text-stone-900">Дякуємо!</h2>
        <p className="text-sm leading-snug text-stone-600">
          Ваш запит надіслано. Менеджер зв&apos;яжеться з вами протягом
          робочого дня.
        </p>
      </div>

      <dl className="w-full space-y-1.5 rounded-lg border border-stone-200 bg-stone-50 p-3 text-left text-sm">
        <div className="flex items-center justify-between">
          <dt className="text-stone-500">Продукт</dt>
          <dd className="font-medium text-stone-900">
            {shapeName}
            {showFlavor && <span className="text-stone-500"> — {flavorName}</span>}
          </dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-stone-500">Кількість</dt>
          <dd className="font-medium tabular-nums text-stone-900">
            {quantity} шт
          </dd>
        </div>
        {totalPrice !== null && (
          <div className="flex items-center justify-between">
            <dt className="text-stone-500">Сума</dt>
            <dd className="font-semibold tabular-nums text-stone-900">
              {formatUah(totalPrice)}
            </dd>
          </div>
        )}
        {submittedEmail && (
          <div className="flex items-center justify-between gap-2">
            <dt className="text-stone-500">Контакт</dt>
            <dd className="truncate font-medium text-stone-900">
              {submittedEmail}
            </dd>
          </div>
        )}
      </dl>

      <div className="flex w-full gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="flex-1 justify-center"
        >
          Закрити
        </Button>
        <Button
          type="button"
          onClick={onNewDesign}
          className="flex-1 justify-center gap-2 bg-stone-900 text-white hover:bg-stone-800"
        >
          <Plus className="h-4 w-4" />
          Створити ще
        </Button>
      </div>
    </div>
  );
}

interface FieldProps {
  label: string;
  required?: boolean;
  type?: string;
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  autoComplete?: string;
  placeholder?: string;
}

function Field({
  label,
  required,
  type = "text",
  value,
  onChange,
  disabled,
  autoComplete,
  placeholder,
}: FieldProps) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-stone-500">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        disabled={disabled}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className="w-full rounded-md border border-stone-300 bg-white px-3 py-2 text-sm focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-600/20 disabled:opacity-50"
      />
    </label>
  );
}

interface FieldTextareaProps {
  label: string;
  value: string;
  onChange: (next: string) => void;
  disabled?: boolean;
  rows?: number;
}

function FieldTextarea({
  label,
  value,
  onChange,
  disabled,
  rows = 3,
}: FieldTextareaProps) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-stone-500">
        {label}
      </span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        rows={rows}
        className="w-full resize-y rounded-md border border-stone-300 bg-white px-3 py-2 text-sm focus:border-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-600/20 disabled:opacity-50"
      />
    </label>
  );
}
