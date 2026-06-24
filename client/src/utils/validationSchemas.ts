import { z } from 'zod'

import type { AuthMode, ReviewFormValues, TranslateFn } from '../types/shop'

const PHONE_PATTERN = /^[0-9+\-\s().]{8,20}$/

function message(t: TranslateFn, key: string) {
  return t(`validation.${key}`)
}

function requiredText(t: TranslateFn, key = 'required') {
  return z.string().trim().min(1, message(t, key))
}

function nameSchema(t: TranslateFn) {
  return z.string().trim().min(2, message(t, 'name'))
}

function emailSchema(t: TranslateFn) {
  return z.string().trim().email(message(t, 'email'))
}

function passwordSchema(t: TranslateFn) {
  return z.string().min(6, message(t, 'password'))
}

function optionalPhoneSchema(t: TranslateFn) {
  return z
    .string()
    .trim()
    .optional()
    .or(z.literal(''))
    .refine((value) => !value || PHONE_PATTERN.test(value), message(t, 'phone'))
}

function numericStringSchema(t: TranslateFn, key: string) {
  return z
    .union([z.string(), z.number()])
    .refine((value) => String(value).trim() !== '', message(t, 'required'))
    .transform((value) => Number(value))
    .refine((value) => Number.isFinite(value) && value >= 0, message(t, key))
}

export function createAuthSchema(t: TranslateFn, mode: AuthMode) {
  const base = {
    email: emailSchema(t),
    password: passwordSchema(t),
  }

  return z.object(mode === 'register' ? { ...base, name: nameSchema(t) } : base)
}

export function createPasswordResetRequestSchema(t: TranslateFn) {
  return z.object({
    email: emailSchema(t),
  })
}

export function createResetPasswordSchema(t: TranslateFn) {
  return z
    .object({
      password: passwordSchema(t),
      confirmPassword: passwordSchema(t),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: message(t, 'confirmPassword'),
      path: ['confirmPassword'],
    })
}

export function createCheckoutSchema(t: TranslateFn) {
  return z.object({
    name: nameSchema(t),
    email: emailSchema(t),
    phone: optionalPhoneSchema(t),
    address: z.string().trim().min(5, message(t, 'address')),
    payment: requiredText(t),
    selectedAddressId: z.string().optional(),
  })
}

export function createContactSchema(t: TranslateFn, isSignedIn: boolean) {
  const signedInShape = {
    topic: requiredText(t, 'topic'),
    message: z.string().trim().min(10, message(t, 'message')),
  }

  if (isSignedIn) return z.object(signedInShape)

  return z.object({
    ...signedInShape,
    name: nameSchema(t),
    email: emailSchema(t),
    phone: optionalPhoneSchema(t),
  })
}

export function createReviewSchema(t: TranslateFn) {
  return z.object({
    comment: z.string().trim().min(3, message(t, 'review')),
    images: z.custom<ReviewFormValues['images']>().optional(),
  })
}

export function createProfileSchema(t: TranslateFn) {
  return z.object({
    name: nameSchema(t),
    email: emailSchema(t),
    phone: optionalPhoneSchema(t),
    selectedAddress: z.object({
      address: z.string().trim().min(5, message(t, 'address')),
    }),
  })
}

export function createInventoryProductSchema(t: TranslateFn, { requiresImage = false }: { requiresImage?: boolean } = {}) {
  return z.object({
    name: nameSchema(t),
    category: requiredText(t, 'category'),
    price: numericStringSchema(t, 'price'),
    stock: numericStringSchema(t, 'stock'),
    image: requiresImage ? requiredText(t, 'image') : z.string().optional(),
    description: z.string().trim().min(10, message(t, 'description')),
  })
}

export function createCategorySchema(t: TranslateFn) {
  return z.object({
    name: nameSchema(t),
  })
}
