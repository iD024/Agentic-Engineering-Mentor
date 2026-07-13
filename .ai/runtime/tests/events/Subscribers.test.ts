import { describe, it, expect } from 'vitest';
import { LoggerSubscriber } from '../../src/events/subscribers/LoggerSubscriber.js';
import { MetricsSubscriber } from '../../src/events/subscribers/MetricsSubscriber.js';
import { HealthMonitorSubscriber } from '../../src/events/subscribers/HealthMonitorSubscriber.js';
import { ExporterSubscriber } from '../../src/events/subscribers/ExporterSubscriber.js';

describe('Subscribers', () => {
  it('LoggerSubscriber should support correct events', () => {
    const subscriber = new LoggerSubscriber();
    expect(subscriber.supportedEvents).toContain('WorkspaceLoaded');
    expect(subscriber.getHandler('WorkspaceLoaded')).toBeDefined();
    expect(subscriber.getHandler('UnknownEvent')).toBeUndefined();
  });

  it('MetricsSubscriber should support correct events', () => {
    const subscriber = new MetricsSubscriber();
    expect(subscriber.supportedEvents).toContain('SessionStarted');
    expect(subscriber.getHandler('SessionStarted')).toBeDefined();
  });

  it('HealthMonitorSubscriber should support correct events', () => {
    const subscriber = new HealthMonitorSubscriber();
    expect(subscriber.supportedEvents).toContain('DatabaseDisconnected');
    expect(subscriber.getHandler('DatabaseDisconnected')).toBeDefined();
  });

  it('ExporterSubscriber should support correct events', () => {
    const subscriber = new ExporterSubscriber();
    expect(subscriber.supportedEvents).toContain('WorkspaceExported');
    expect(subscriber.getHandler('WorkspaceExported')).toBeDefined();
  });
});
