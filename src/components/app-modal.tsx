"use client";

import type { ReactNode } from "react";

type AppModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  titleId?: string;
  children: ReactNode;
  closeOnOverlay?: boolean;
  maxWidthClass?: string;
  overlayClassName?: string;
  panelClassName?: string;
};

/**
 * Modale scrollable, compatible clavier mobile (iOS/Android) :
 * overlay scrollable, panneau limité en hauteur (dvh), ancré en bas sur mobile.
 */
export function AppModal({
  open,
  onClose,
  title,
  titleId = "app-modal-title",
  children,
  closeOnOverlay = true,
  maxWidthClass = "max-w-md",
  overlayClassName = "bg-black/50",
  panelClassName = "",
}: AppModalProps) {
  if (!open) return null;

  return (
    <div
      className={`fixed inset-0 z-50 overflow-y-auto overscroll-contain ${overlayClassName}`}
      onClick={closeOnOverlay ? onClose : undefined}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId : undefined}
    >
      <div className="flex min-h-[100dvh] w-full items-end justify-center p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] sm:min-h-full sm:items-center sm:py-8">
        <div
          className={`my-0 w-full ${maxWidthClass} max-h-[min(88dvh,100%)] overflow-y-auto overscroll-contain rounded-xl bg-[var(--background-card)] p-6 shadow-lg sm:my-auto ${panelClassName}`}
          onClick={(e) => e.stopPropagation()}
        >
          {title ? (
            <h2
              id={titleId}
              className="mb-4 text-lg font-semibold text-[var(--foreground)]"
            >
              {title}
            </h2>
          ) : null}
          {children}
        </div>
      </div>
    </div>
  );
}
