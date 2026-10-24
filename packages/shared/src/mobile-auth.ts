import { z } from "zod";

export const mobileAuthExchangeSchema = z.object({
  code: z.string().regex(/^[A-Za-z0-9_-]{40,100}$/),
  verifier: z.string().min(43).max(128),
});
