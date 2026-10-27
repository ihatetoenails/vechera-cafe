"use client";

import { AdminShell } from "@/components/AdminShell";
import { useSiteSettings } from "@/context/SiteSettingsContext";

export default function AdminSettingsPage() {
  const { settings, updateSettings } = useSiteSettings();

  return (
    <AdminShell
      active="settings"
      title="Настройки"
      subtitle="Доставка по населённым пунктам"
      showLocationSwitcher={false}
    >
      <section className="mt-6 max-w-2xl rounded-[22px] border border-line bg-surface p-4 shadow-[var(--shadow-soft)] sm:p-6">
        <h2 className="font-display text-lg font-semibold text-[var(--espresso)]">
          Доставка
        </h2>
        <p className="mt-1 text-sm text-ink-muted">
          Сумма подставляется в корзине по выбранному селу или городу и входит в
          итог заказа. В прайсе уже заложено +50 ₽ к каждому пункту.
        </p>

        <label className="mt-5 block text-sm font-medium text-ink">
          Текст в корзине
          <textarea
            value={settings.deliveryNote}
            onChange={(e) => updateSettings({ deliveryNote: e.target.value })}
            rows={3}
            className="admin-input mt-1.5 w-full resize-y"
          />
        </label>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <label className="block text-sm font-medium text-ink">
            После, часов
            <input
              type="number"
              min={0}
              max={23}
              value={settings.afterHoursHour}
              onChange={(e) =>
                updateSettings({
                  afterHoursHour: Number(e.target.value) || 0,
                })
              }
              className="admin-input mt-1.5 w-full"
            />
          </label>
          <label className="block text-sm font-medium text-ink">
            Наценка после {settings.afterHoursHour}:00, ₽
            <input
              type="number"
              min={0}
              value={settings.afterHoursSurcharge}
              onChange={(e) =>
                updateSettings({
                  afterHoursSurcharge: Number(e.target.value) || 0,
                })
              }
              className="admin-input mt-1.5 w-full"
            />
          </label>
          <label className="block text-sm font-medium text-ink">
            Подъём, ₽
            <input
              type="number"
              min={0}
              value={settings.liftSurcharge}
              onChange={(e) =>
                updateSettings({
                  liftSurcharge: Number(e.target.value) || 0,
                })
              }
              className="admin-input mt-1.5 w-full"
            />
          </label>
        </div>

        <div className="mt-6 overflow-hidden rounded-xl border border-line">
          <table className="w-full text-sm">
            <thead className="bg-bg/60 text-left text-ink-muted">
              <tr>
                <th className="px-3 py-2 font-medium">Населённый пункт</th>
                <th className="w-28 px-3 py-2 font-medium">Цена, ₽</th>
              </tr>
            </thead>
            <tbody>
              {settings.deliveryZones.map((zone) => (
                <tr key={zone.id} className="border-t border-line">
                  <td className="px-3 py-2 text-ink">{zone.name}</td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min={0}
                      value={zone.fee}
                      onChange={(e) =>
                        updateSettings({
                          deliveryZones: settings.deliveryZones.map((z) =>
                            z.id === zone.id
                              ? { ...z, fee: Number(e.target.value) || 0 }
                              : z,
                          ),
                        })
                      }
                      className="admin-input w-full"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}
