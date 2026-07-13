import { z } from 'zod';

export const WorkspaceLoadedPayloadSchema = z.object({
  workspaceId: z.string(),
  path: z.string(),
});

export const WorkspaceSavedPayloadSchema = z.object({
  workspaceId: z.string(),
  path: z.string(),
});

export const WorkspaceImportedPayloadSchema = z.object({
  workspaceId: z.string(),
  sourcePath: z.string(),
});

export const WorkspaceExportedPayloadSchema = z.object({
  workspaceId: z.string(),
  destinationPath: z.string(),
});

export const SessionStartedPayloadSchema = z.object({
  sessionId: z.string(),
  workspaceId: z.string(),
  startTime: z.string().datetime(),
});

export const SessionEndedPayloadSchema = z.object({
  sessionId: z.string(),
  workspaceId: z.string(),
  endTime: z.string().datetime(),
  durationMs: z.number(),
});

export const MilestoneCompletedPayloadSchema = z.object({
  milestoneId: z.string(),
  workspaceId: z.string(),
});

export const LearningProgressUpdatedPayloadSchema = z.object({
  topicId: z.string(),
  progressPercentage: z.number().min(0).max(100),
});

export const DependencyUpdatedPayloadSchema = z.object({
  dependencyName: z.string(),
  oldVersion: z.string(),
  newVersion: z.string(),
});

export const RuntimeReadyPayloadSchema = z.object({});

export const RuntimeStoppingPayloadSchema = z.object({
  reason: z.string().optional(),
});

export const DatabaseConnectedPayloadSchema = z.object({
  connectionString: z.string().optional(),
});

export const DatabaseDisconnectedPayloadSchema = z.object({
  reason: z.string().optional(),
});
