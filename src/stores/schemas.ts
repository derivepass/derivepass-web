import { z } from 'zod';

import { check as isValidRange } from '../util/ranges';

export const ApplicationDataSchema = z.object({
  domain: z.string()
    .trim()
    .min(1, 'Domain name can\'t be empty')
    .refine(
      domain => !/[A-Z]/.test(domain),
      'Domain name must be lower case',
    )
    .refine(
      domain => domain !== 'derivepass',
      '"derivepass" domain is reserved',
    )
    .refine(
      domain => !/^(www|\w+:\/\/)/.test(domain),
      'Domain name should not start with `www.`, `http://`, or any `schema://`',
    ),
  login: z.string()
    .trim()
    .min(1, 'Username can\'t be empty'),
  revision: z.number().positive('Revision must be a positive number'),
  allowedChars: z.string()
    .trim()
    .min(1, 'Allowed characters can\'t be empty')
    .refine(isValidRange, 'Allowed characters contain invalid range'),
  requiredChars: z.string()
    .trim()
    .refine(isValidRange, 'Allowed characters contain invalid range'),
  passwordLen: z.number().positive(),
});

export type ApplicationData = z.infer<typeof ApplicationDataSchema>;

export const ApplicationSchema = z.object({
  id: z.string().min(1),
  v: z.number().positive(),
}).and(ApplicationDataSchema);

export type Application = z.infer<typeof ApplicationSchema>;
