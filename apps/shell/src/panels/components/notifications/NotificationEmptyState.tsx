import React from "react";
import { FDBox } from "@nex/fd-ui";
import type { FilterKey } from "./shared";

export default function NotificationEmptyState({ filter }: { filter: FilterKey }) {
  const content =
    filter === "unread"
      ? {
          title: "Nessuna notifica da leggere",
          description: "Hai già gestito tutto. Qui compariranno solo le nuove notifiche non lette.",
        }
      : filter === "read"
        ? {
            title: "Nessuna notifica letta",
            description: "Quando aprirai o segnerai come lette le notifiche, le ritroverai qui.",
          }
        : {
            title: "Nessuna notifica",
            description: "Al momento il centro notifiche è vuoto.",
          };

  return (
    <FDBox variant="soft" color="neutral" radius="2xl" pad="lg" className="mx-4 my-6 flex min-h-[260px] flex-col items-center justify-center text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-sky-50 text-2xl dark:bg-sky-900/30">🔔</div>
      <h4 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">{content.title}</h4>
      <p className="mt-2 max-w-[320px] text-sm leading-6 text-neutral-600 dark:text-neutral-400">{content.description}</p>
    </FDBox>
  );
}
