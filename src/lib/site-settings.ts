import {
  DEFAULT_AFTER_HOURS_HOUR,
  DEFAULT_AFTER_HOURS_SURCHARGE,
  DEFAULT_DELIVERY_ZONES,
  DEFAULT_LIFT_SURCHARGE,
  type DeliveryZone,
} from "./delivery-zones";

export type SiteSettings = {
  /** Стоимость доставки по Беслану, ₽ (для старых экранов) */
  deliveryFee: number;
  /** Текст уведомления в корзине */
  deliveryNote: string;
  deliveryZones: DeliveryZone[];
  afterHoursHour: number;
  afterHoursSurcharge: number;
  liftSurcharge: number;
};

const DEFAULT_NOTE =
  "Стоимость доставки зависит от населённого пункта. После 22:00 и за подъём — плюс 50 ₽.";

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  deliveryFee: 200,
  deliveryNote: DEFAULT_NOTE,
  deliveryZones: DEFAULT_DELIVERY_ZONES,
  afterHoursHour: DEFAULT_AFTER_HOURS_HOUR,
  afterHoursSurcharge: DEFAULT_AFTER_HOURS_SURCHARGE,
  liftSurcharge: DEFAULT_LIFT_SURCHARGE,
};

function normalizeZone(raw: Partial<DeliveryZone> | null | undefined, fallback: DeliveryZone) {
  const fee = Number(raw?.fee);
  const aliases = Array.isArray(raw?.aliases)
    ? raw.aliases.map((a) => String(a).trim()).filter(Boolean)
    : fallback.aliases;
  return {
    id: String(raw?.id || fallback.id),
    name: String(raw?.name || fallback.name).trim() || fallback.name,
    fee: Number.isFinite(fee) && fee >= 0 ? Math.round(fee) : fallback.fee,
    aliases: aliases.length ? aliases : fallback.aliases,
    fromFee: Boolean(raw?.fromFee ?? fallback.fromFee),
  } satisfies DeliveryZone;
}

export function normalizeSiteSettings(
  raw: Partial<SiteSettings> | null | undefined,
): SiteSettings {
  const incoming = Array.isArray(raw?.deliveryZones) ? raw.deliveryZones : [];
  const byId = new Map(
    incoming
      .filter((z): z is DeliveryZone => Boolean(z && typeof z === "object" && z.id))
      .map((z) => [z.id, z]),
  );

  const deliveryZones = DEFAULT_DELIVERY_ZONES.map((def) =>
    normalizeZone(byId.get(def.id), def),
  );

  for (const extra of incoming) {
    if (!extra?.id || deliveryZones.some((z) => z.id === extra.id)) continue;
    deliveryZones.push(normalizeZone(extra, {
      id: extra.id,
      name: extra.name || extra.id,
      fee: Number(extra.fee) || 0,
      aliases: extra.aliases || [],
    }));
  }

  const beslan = deliveryZones.find((z) => z.id === "beslan");
  const fee = Number(raw?.deliveryFee);
  const afterHour = Number(raw?.afterHoursHour);
  const afterFee = Number(raw?.afterHoursSurcharge);
  const liftFee = Number(raw?.liftSurcharge);

  return {
    deliveryFee:
      Number.isFinite(fee) && fee >= 0
        ? Math.round(fee)
        : beslan?.fee ?? DEFAULT_SITE_SETTINGS.deliveryFee,
    deliveryNote:
      typeof raw?.deliveryNote === "string" && raw.deliveryNote.trim()
        ? raw.deliveryNote.trim()
        : DEFAULT_SITE_SETTINGS.deliveryNote,
    deliveryZones,
    afterHoursHour:
      Number.isFinite(afterHour) && afterHour >= 0 && afterHour <= 23
        ? Math.round(afterHour)
        : DEFAULT_AFTER_HOURS_HOUR,
    afterHoursSurcharge:
      Number.isFinite(afterFee) && afterFee >= 0
        ? Math.round(afterFee)
        : DEFAULT_AFTER_HOURS_SURCHARGE,
    liftSurcharge:
      Number.isFinite(liftFee) && liftFee >= 0
        ? Math.round(liftFee)
        : DEFAULT_LIFT_SURCHARGE,
  };
}
