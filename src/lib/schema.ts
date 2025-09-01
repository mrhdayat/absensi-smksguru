import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email({
    message: "Masukkan email yang valid."
  }),
  password: z.string().min(6, {
    message: "Password harus minimal 6 karakter."
  }),
});