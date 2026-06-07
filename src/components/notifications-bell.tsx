"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

type NotificationItem = {
  id: string;
  type: string;
  message: string;
  read: boolean;
  link: string | null;
  feedbackId: string | null;
  createdAt: string;
};

const bellIconClass =
  "h-5 w-5 flex-shrink-0 text-slate-600 transition-colors group-hover:text-primary";

function IconBell() {
  return (
    <svg
      className={bellIconClass}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
      />
    </svg>
  );
}

export function NotificationsBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [satisfyingId, setSatisfyingId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  async function markAsReadAndNavigate(item: NotificationItem) {
    if (item.type === "feedback_resolved") return;
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id }),
    });
    setNotifications((prev) => prev.filter((n) => n.id !== item.id));
    setOpen(false);
    if (item.link) {
      router.push(item.link);
    }
  }

  async function handleSatisfaction(
    item: NotificationItem,
    satisfaction: "up" | "down"
  ) {
    if (!item.feedbackId) return;
    setSatisfyingId(item.id);
    try {
      const res = await fetch("/api/feedback/satisfaction", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feedbackId: item.feedbackId,
          satisfaction,
          notificationId: item.id,
        }),
      });
      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => n.id !== item.id));
        setOpen(false);
      }
    } finally {
      setSatisfyingId(null);
    }
  }

  async function markAllAsRead() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
    setNotifications([]);
    setOpen(false);
  }

  const unreadCount = notifications.length;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          if (!open) fetchNotifications();
        }}
        className="group btn-relief relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} non lues)` : ""}`}
        aria-expanded={open}
      >
        <IconBell />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full z-50 mt-2 w-80 origin-top-right rounded-xl border border-slate-200 bg-white shadow-xl"
          role="menu"
        >
          <div className="border-b border-slate-200 px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-800">
              Notifications
            </h3>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <p className="px-4 py-6 text-center text-sm text-slate-500">
                Chargement…
              </p>
            ) : notifications.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-slate-500">
                Aucune notification
              </p>
            ) : (
              <ul className="py-2">
                {notifications.map((item) => (
                  <li key={item.id}>
                    {item.type === "feedback_resolved" ? (
                      <div className="border-b border-slate-100 px-4 py-3">
                        {(() => {
                          const [line1, line2] = (item.message ?? "").split("\n");
                          return (
                            <>
                              <p className="text-sm text-slate-800">
                                {line1}
                              </p>
                              {line2 && (
                                <p className="mt-0.5 line-clamp-2 text-xs italic text-slate-400">
                                  {line2}
                                </p>
                              )}
                            </>
                          );
                        })()}
                        <p className="mt-0.5 text-xs text-slate-500">
                          {new Date(item.createdAt).toLocaleString("fr-FR", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </p>
                        <div className="mt-2 flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleSatisfaction(item, "up")}
                            disabled={satisfyingId === item.id}
                            className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm transition hover:bg-slate-200 disabled:opacity-50"
                          >
                            👍
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSatisfaction(item, "down")}
                            disabled={satisfyingId === item.id}
                            className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm transition hover:bg-slate-200 disabled:opacity-50"
                          >
                            👎
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => markAsReadAndNavigate(item)}
                        className="w-full px-4 py-3 text-left transition hover:bg-slate-50"
                      >
                        <p className="text-sm text-slate-800">
                          {item.message}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {new Date(item.createdAt).toLocaleString("fr-FR", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </p>
                        {item.link && (
                          <p className="mt-0.5 text-xs text-primary">
                            Voir →
                          </p>
                        )}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
          {notifications.length > 0 && (
            <div className="border-t border-slate-200 px-2 py-2">
              <button
                type="button"
                onClick={markAllAsRead}
                className="w-full rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Tout marquer comme lu
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
