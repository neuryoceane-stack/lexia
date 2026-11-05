"use client";

import { forwardRef, type InputHTMLAttributes } from "react";

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

export const ListNameInput = forwardRef<HTMLInputElement, ListNameInputProps>(
  function ListNameInput({ id, ...rest }, ref) {
    return <input ref={ref} id={id} {...LIST_NAME_FIELD_PROPS} {...rest} />;
  }
);

/** Champs mot / traduction : évite l’autocomplétion contact iOS. */
export const VOCAB_WORD_FIELD_PROPS = {
  name: "vocabWord",
  type: "text" as const,
  inputMode: "text" as const,
  autoComplete: "off",
  autoCorrect: "off",
  autoCapitalize: "none" as const,
  spellCheck: false,
  "data-1p-ignore": true,
  "data-lpignore": "true",
  "data-form-type": "other",
};

/** Recherche de mots dans une liste. */
export const VOCAB_SEARCH_FIELD_PROPS = {
  name: "vocabSearch",
  autoComplete: "off",
  autoCorrect: "off",
  autoCapitalize: "none" as const,
  spellCheck: false,
  "data-1p-ignore": true,
  "data-lpignore": "true",
  "data-form-type": "search",
};
