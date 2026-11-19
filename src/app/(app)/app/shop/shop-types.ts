export type ShopPackClient = {
  id: string;
  title: string;
  description: string;
  price: number;
  language: string;
  level: string;
  type: string;
  wordsJson?: string | null;
  wordCount: number;
  expressionCount: number;
  owned: boolean;
  listId: string | null;
};