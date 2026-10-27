export type DeliveryZone = {
  id: string;
  name: string;
  fee: number;
  /** Подписи для поиска в адресе */
  aliases: string[];
  /** «от N ₽», как Владикавказ */
  fromFee?: boolean;
};

export type DeliveryQuoteInput = {
  zoneId?: string;
  street?: string;
  floor?: string;
  needLift?: boolean;
  datetime?: string;
};

export type DeliveryQuote = {
  ok: true;
  zoneId: string;
  zoneName: string;
  baseFee: number;
  lateFee: number;
  liftFee: number;
  fee: number;
  fromFee?: boolean;
};

/** Прайс курьера + 50 ₽ к каждому пункту, как просили. */
export const DEFAULT_DELIVERY_ZONES: DeliveryZone[] = [
  { id: "beslan", name: "г. Беслан", fee: 200, aliases: ["беслан"] },
  {
    id: "beslan-special",
    name: "Беслан: Конный двор, Пенька завод, ул. Подгорная",
    fee: 250,
    aliases: ["конный двор", "конный", "пенька", "подгорная", "подгорн"],
  },
  {
    id: "n-batako",
    name: "с. Н. Батако",
    fee: 300,
    aliases: ["н. батако", "н батако", "новый батако", "новобатако"],
  },
  {
    id: "stary-batako",
    name: "Старый Батако",
    fee: 650,
    aliases: ["старый батако", "с. батако", "с батако"],
  },
  { id: "zilga", name: "с. Зильга", fee: 300, aliases: ["зильга"] },
  { id: "khumalag", name: "с. Хумалаг", fee: 350, aliases: ["хумалаг"] },
  { id: "brut", name: "с. Брут", fee: 500, aliases: ["брут"] },
  {
    id: "dar-kokh",
    name: "с. Дар-Кох",
    fee: 600,
    aliases: ["дар-кох", "даркох", "дар кох"],
  },
  { id: "kardzhin", name: "с. Карджин", fee: 750, aliases: ["карджин"] },
  { id: "elhotovo", name: "с. Эльхотово", fee: 1150, aliases: ["эльхотово"] },
  { id: "razdzog", name: "с. Раздзог", fee: 650, aliases: ["раздзог"] },
  { id: "tsalyk", name: "с. Цалык", fee: 550, aliases: ["цалык"] },
  { id: "zamankul", name: "с. Заманкул", fee: 700, aliases: ["заманкул"] },
  {
    id: "alkhanchurt",
    name: "пос. Алханчурт",
    fee: 350,
    aliases: ["алханчурт"],
  },
  {
    id: "mikhailovskoe",
    name: "с. Михайловское",
    fee: 500,
    aliases: ["михайловское", "михайловск"],
  },
  {
    id: "zavodskoy",
    name: "ПГТ Заводской",
    fee: 550,
    aliases: ["заводской", "пгт заводской"],
  },
  { id: "farn", name: "с. Фарн", fee: 300, aliases: ["фарн"] },
  { id: "kosta", name: "с. Коста", fee: 350, aliases: ["коста"] },
  { id: "cmti", name: "с. ЦМТИ", fee: 450, aliases: ["цмти"] },
  { id: "kirova", name: "с. Кирова", fee: 550, aliases: ["кирова"] },
  { id: "michurino", name: "с. Мичурино", fee: 700, aliases: ["мичурино"] },
  { id: "ardon", name: "г. Ардон", fee: 800, aliases: ["ардон"] },
  {
    id: "arkhonskaya",
    name: "ст. Архонская",
    fee: 500,
    aliases: ["архонская"],
  },
  {
    id: "vladikavkaz",
    name: "г. Владикавказ",
    fee: 650,
    aliases: ["владикавказ"],
    fromFee: true,
  },
];

export const DEFAULT_AFTER_HOURS_HOUR = 22;
export const DEFAULT_AFTER_HOURS_SURCHARGE = 50;
export const DEFAULT_LIFT_SURCHARGE = 50;

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[«»"'.,/\\()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function findDeliveryZone(
  zones: DeliveryZone[],
  zoneId?: string,
  street?: string,
): DeliveryZone | undefined {
  if (zoneId) {
    const byId = zones.find((z) => z.id === zoneId);
    if (byId) {
      if (byId.id === "beslan" && street) {
        const special = matchZoneByStreet(
          zones.filter((z) => z.id === "beslan-special"),
          street,
        );
        if (special) return special;
      }
      return byId;
    }
  }
  if (street) return matchZoneByStreet(zones, street);
  return undefined;
}

function matchZoneByStreet(zones: DeliveryZone[], street: string) {
  const hay = normalizeText(street);
  if (!hay) return undefined;
  let best: { zone: DeliveryZone; len: number } | undefined;
  for (const zone of zones) {
    for (const alias of zone.aliases) {
      const needle = normalizeText(alias);
      if (needle.length >= 3 && hay.includes(needle)) {
        if (!best || needle.length > best.len) {
          best = { zone, len: needle.length };
        }
      }
    }
  }
  return best?.zone;
}

export function moscowHour(datetime?: string) {
  const date = datetime
    ? new Date(datetime.includes("T") ? datetime : datetime.replace(" ", "T"))
    : new Date();
  if (Number.isNaN(date.getTime())) return new Date().getHours();
  const hour = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Moscow",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  return Number(hour.find((p) => p.type === "hour")?.value ?? 0);
}

function needsLift(floor?: string, needLift?: boolean) {
  if (needLift) return true;
  const raw = (floor || "").trim();
  if (!raw) return false;
  const n = Number(raw.replace(/\D/g, ""));
  if (Number.isFinite(n) && n > 1) return true;
  return /[2-9]|10|11|12|этаж/i.test(raw) && !/^1$/.test(raw);
}

export function quoteDelivery(
  zones: DeliveryZone[],
  input: DeliveryQuoteInput,
  extras?: {
    afterHoursHour?: number;
    afterHoursSurcharge?: number;
    liftSurcharge?: number;
  },
): DeliveryQuote | { ok: false; message: string } {
  const zone = findDeliveryZone(zones, input.zoneId, input.street);
  if (!zone) {
    return {
      ok: false,
      message: "Выберите населённый пункт для доставки",
    };
  }

  const afterHour = extras?.afterHoursHour ?? DEFAULT_AFTER_HOURS_HOUR;
  const lateSurcharge =
    extras?.afterHoursSurcharge ?? DEFAULT_AFTER_HOURS_SURCHARGE;
  const liftSurcharge = extras?.liftSurcharge ?? DEFAULT_LIFT_SURCHARGE;

  const lateFee = moscowHour(input.datetime) >= afterHour ? lateSurcharge : 0;
  const liftFee = needsLift(input.floor, input.needLift) ? liftSurcharge : 0;

  return {
    ok: true,
    zoneId: zone.id,
    zoneName: zone.name,
    baseFee: zone.fee,
    lateFee,
    liftFee,
    fee: zone.fee + lateFee + liftFee,
    fromFee: zone.fromFee,
  };
}

export function formatDeliveryFee(quote: DeliveryQuote) {
  const prefix = quote.fromFee ? "от " : "";
  return `${prefix}${quote.fee} ₽`;
}
