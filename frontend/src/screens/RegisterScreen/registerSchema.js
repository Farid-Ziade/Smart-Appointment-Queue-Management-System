import { object, string } from "yup";

export const registerSchema = object({
  fullName: string().trim().required("Enter your full name."),

  email: string()
    .trim()
    .lowercase()
    .required("Enter your email.")
    .matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, {
      message: "Enter a valid email address.",
      excludeEmptyString: true,
    }),

  phone: string().trim().required("Enter your phone number."),

  password: string()
    .required("Enter a password.")
    .min(8, "Use at least 8 characters.")
    .test(
      "password-bytes",
      "Password is too long. Please use a shorter password.",
      (value) => new TextEncoder().encode(value ?? "").length <= 72,
    ),
});
