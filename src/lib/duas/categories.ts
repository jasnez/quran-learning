import type { DuaCategory } from "@/types/duas";

export const CATEGORY_LABELS: Record<DuaCategory, string> = {
  forgiveness: "Za oprost",
  knowledge: "Za znanje",
  guidance: "Za uputu",
  patience: "Za strpljenje",
  family: "Za porodicu",
  rabbana: "Rabbena dove",
};

export const CATEGORY_ORDER: DuaCategory[] = [
  "rabbana",
  "forgiveness",
  "knowledge",
  "guidance",
  "patience",
  "family",
];
