"use client";

import type { InputHTMLAttributes } from "react";

/** Attributs neutres pour éviter l'autocomplétion contacts iOS sur un titre de liste. */
export const LIST_NAME_FIELD_PROPS = {
  name: "listName",
  type: "text" as const,
  inputMode: "text" as const,
  autoComplete: "off",
  autoCorrect: "off",
  autoCapitalize: "sentences" as const,
  spellCheck: false,
  "data-1p-ignore": true,
  "data-lpignore": "true",
  "data-form-type": "other",
};

export type ListNameInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "name" | "type" | "inputMode" | "autoComplete" | "autoCorrect" | "autoCapitalize" | "spellCheck"
> & {
  id: string;
};

export function ListNameInput({ id, ...rest }: ListNameInputProps) {
  return <input id={id} {...LIST_NAME_FIELD_PROPS} {...rest} />;
}
