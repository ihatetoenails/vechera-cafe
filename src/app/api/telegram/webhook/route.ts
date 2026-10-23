import { NextResponse } from "next/server";
import { handleTelegramUpdate, type TelegramUpdate } from "@/lib/telegram-bot";
import { vecheraDataDir } from "@/lib/data-dir";
import {
  readTelegramSubscribers,
  telegramBotToken,
} from "@/lib/telegram-subscribers";

export async function POST(request: Request) {
  try {
    if (!telegramBotToken()) {
      return NextResponse.json({ ok: true });
    }
    const update = (await request.json()) as TelegramUpdate;
    await handleTelegramUpdate(update);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[telegram webhook]", err);
    return NextResponse.json({ ok: true });
  }
}

type PollerSubscriber = {
  chatId?: string;
  name?: string;
  username?: string;
};

function publicSubscribers(
  list: PollerSubscriber[],
): { name: string | null; username: string | null }[] {
  return list.map((s) => ({
    name: s.name?.trim() || null,
    username: s.username
      ? s.username.startsWith("@")
        ? s.username
        : `@${s.username}`
      : null,
  }));
}

export async function GET() {
  const subscribers = await readTelegramSubscribers();
  let pollerCount: number | null = null;
  let pollerSubs: PollerSubscriber[] | null = null;
  try {
    const res = await fetch("http://127.0.0.1:38745/status", {
      signal: AbortSignal.timeout(2000),
    });
    const data = (await res.json()) as {
      ok?: boolean;
      subscriberCount?: number;
      subscribers?: PollerSubscriber[];
    };
    if (data.ok) {
      pollerCount = Number(data.subscriberCount) || 0;
      if (Array.isArray(data.subscribers)) pollerSubs = data.subscribers;
    }
  } catch {
    /* poller down */
  }
  const list = pollerSubs ?? subscribers;
  return NextResponse.json({
    ok: true,
    service: "telegram-bot",
    tokenConfigured: Boolean(telegramBotToken()),
    mode: "polling",
    subscriberCount: pollerCount ?? list.length,
    pollerOk: pollerCount !== null,
    dataDir: vecheraDataDir(),
    subscribers: publicSubscribers(list),
  });
}
