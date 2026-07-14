import { z } from 'zod';

/**
 * Zod schema for validating environment variables.
 *
 * Defines the shape, types, defaults, and constraints for all runtime
 * configuration values. The inferred type is used by ConfigValidator
 * to produce a typed configuration object.
 */
export const configSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development')
    .describe('Application environment'),

  LOG_LEVEL: z
    .enum(['debug', 'info', 'warn', 'error'])
    .default('info')
    .describe('Minimum log level for output filtering'),

  WORKSPACE_ROOT: z
    .string()
    .min(1)
    .default('.')
    .describe('Root directory for the workspace'),

  SHUTDOWN_TIMEOUT_MS: z.coerce
    .number()
    .int()
    .positive()
    .default(10_000)
    .describe('Maximum time in milliseconds for graceful shutdown'),
});

/** Raw validated shape as produced by the Zod schema. */
export type RawValidatedConfig = z.infer<typeof configSchema>;
