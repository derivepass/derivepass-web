import { z } from 'zod';

import { check as isValidRange } from '../util/ranges';

export const VERSION = 1;

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

const HeaderSchema = z.object({
  id: z.string().min(1),
  version: z.literal(VERSION),
});

export const ApplicationSchema = HeaderSchema.and(ApplicationDataSchema);

export type Application = z.infer<typeof ApplicationSchema>;

export const StoredApplicationSchema = HeaderSchema.and(z.object({
  encrypted: z.string(),
  modifiedAt: z.number(),
  removed: z.optional(z.boolean()),
}));

export type StoredApplication = z.infer<typeof StoredApplicationSchema>;

export const HydratedApplicationSchema = StoredApplicationSchema.and(
  z.object({
    decrypted: z.optional(ApplicationDataSchema),
  })
);

export type HydratedApplication = z.infer<typeof HydratedApplicationSchema>;

//
// Settings
//

export const RemoteSyncStateSchema = z.object({
  host: z.string(),
  token: z.string(),
  lastModifiedAt: z.number(),
  lastSyncedAt: z.number(),
});

export type RemoteSyncState = z.infer<typeof RemoteSyncStateSchema>;

export const AuthTokenResponseSchema = z.object({
  token: z.string(),
});

//
// Compatibility with previous version
//

export const LegacyApplicationSchema = z.object({
  uuid: z.string(),
  changedAt: z.number(),
  removed: z.boolean(),

  // Encrypted individually with either:
  // - 'v1:' prefix for AES+HMAC
  // - no prefix for AES
  domain: z.string(),
  login: z.string(),
  revision: z.string(),
  options: z.string(),
});

export const LegacyOptionsSchema = z.object({
  allowed: z.string().trim(),
  required: z.string().trim(),
  maxLength: z.number().or(z.string()),
});
