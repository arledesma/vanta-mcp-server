import { z } from "zod";

export interface Tool<T extends z.ZodObject<z.ZodRawShape>> {
  name: string;
  description: string;
  parameters: T;
}
