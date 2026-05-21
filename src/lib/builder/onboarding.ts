// src/lib/builder/onboarding.ts
//
// Phase 29 / Phase 30 Subtask 4: builder onboarding tours. Split into
// two independent tours — setup + design — each with its own localStorage
// completion flag. The setup tour auto-starts on first visit when the
// buyer is on the setup stage; the design tour auto-starts the first
// time the buyer reaches the design stage. The help button in
// BuilderBreadcrumb restarts whichever tour matches the current stage.

export type TourSide = "top" | "right" | "bottom" | "left";

export interface TourContext {
  stage: "setup" | "design";
  hasDesignContent: boolean;
  isMobile: boolean;
}

export interface TourStep {
  id: string;
  /** CSS selector matched against `document` to find the anchor. */
  targetSelector: string;
  title: string;
  description: string;
  side: TourSide;
  /** When present, the step is included only if this returns true for
   *  the current context. Lets us hide e.g. desktop-only steps on
   *  mobile within a tour. */
  condition?: (ctx: TourContext) => boolean;
}

export const SETUP_TOUR_STEPS: TourStep[] = [
  {
    id: "select-flavor",
    targetSelector: "[data-tour='flavor-carousel']",
    title: "Оберіть смак",
    description: "Натисніть на потрібний смак шоколаду — обраний підсвітиться.",
    side: "bottom",
  },
  {
    id: "set-quantity",
    targetSelector: "[data-tour='qty-stepper']",
    title: "Введіть кількість",
    description: "Чим більше — тим вигідніша ціна за штуку. Можна ввести з клавіатури.",
    side: "top",
  },
  {
    id: "create-design",
    targetSelector: "[data-tour='cta-create-design']",
    title: "Створіть дизайн",
    description: "Перейдіть до редактора, щоб додати логотип, текст і колір тла.",
    side: "top",
  },
];

export const DESIGN_TOUR_STEPS: TourStep[] = [
  {
    id: "add-image",
    targetSelector: "[data-tour='action-image']",
    title: "Додайте логотип",
    description: "Завантажте логотип у PNG, JPG або WEBP — до 10 МБ.",
    side: "top",
  },
  {
    id: "add-text",
    targetSelector: "[data-tour='action-text']",
    title: "Додайте текст",
    description: "Натисніть і введіть напис. Шрифт, розмір і колір — у панелі справа.",
    side: "top",
  },
  {
    id: "background-color",
    targetSelector: "[data-tour='action-background']",
    title: "Колір тла",
    description: "Оберіть колір паперу зі стандартних або введіть свій HEX.",
    side: "top",
  },
  {
    id: "right-panel",
    targetSelector: "[data-tour='right-panel']",
    title: "Налаштування об'єкта",
    description: "Виділіть текст або логотип — праворуч з'являться його параметри.",
    side: "left",
    condition: (ctx) => !ctx.isMobile,
  },
  {
    id: "right-panel-mobile",
    targetSelector: "[data-tour='properties-trigger']",
    title: "Параметри об'єкта",
    description: "Виділіть об'єкт і натисніть, щоб відкрити панель з налаштуваннями.",
    side: "bottom",
    condition: (ctx) => ctx.isMobile,
  },
  {
    id: "left-panel",
    targetSelector: "[data-tour='left-panel']",
    title: "Шари",
    description: "Тут — усі елементи вашого дизайну. Можна сховати, перемістити чи видалити.",
    side: "right",
    condition: (ctx) => !ctx.isMobile,
  },
  {
    id: "left-panel-mobile",
    targetSelector: "[data-tour='layers-trigger']",
    title: "Шари",
    description: "Усі елементи дизайну — приховати, перемістити чи видалити.",
    side: "bottom",
    condition: (ctx) => ctx.isMobile,
  },
  {
    id: "zoom-controls",
    targetSelector: "[data-tour='zoom-cluster']",
    title: "Масштаб і налаштування",
    description: "Наближайте, щоб точніше розмістити деталі. Шестерня — додаткові опції.",
    side: "left",
  },
  {
    id: "submit",
    targetSelector: "[data-tour='topbar-submit']",
    title: "Надішліть запит",
    description: "Коли готові — натисніть, щоб надіслати дизайн менеджеру.",
    side: "bottom",
  },
];

const SETUP_KEY = "cho-a-cho.onboarding.setup-v1";
const DESIGN_KEY = "cho-a-cho.onboarding.design-v1";

function read(key: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(key) === "true";
  } catch {
    return false;
  }
}

function write(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, "true");
  } catch {
    /* private mode / quota — silently ignore */
  }
}

function clear(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export function hasCompletedSetupTour(): boolean {
  return read(SETUP_KEY);
}
export function markSetupTourCompleted(): void {
  write(SETUP_KEY);
}
export function hasCompletedDesignTour(): boolean {
  return read(DESIGN_KEY);
}
export function markDesignTourCompleted(): void {
  write(DESIGN_KEY);
}

export function resetOnboarding(): void {
  clear(SETUP_KEY);
  clear(DESIGN_KEY);
}
