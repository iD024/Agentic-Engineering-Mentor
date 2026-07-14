import { describe, it, expect } from 'vitest';
import { StateSnapshot } from '../../src/state/StateSnapshot.js';
import { createDefaultWorkspace } from '../../src/models/Workspace.js';
import { RuntimeState } from '../../src/kernel/RuntimeState.js';

describe('StateSnapshot', () => {
  const workspace = createDefaultWorkspace('ws-1');

  it('creates a snapshot with an id and timestamp', () => {
    const snap = StateSnapshot.create(RuntimeState.READY, workspace, []);
    expect(snap.id).toBeTruthy();
    expect(snap.takenAt).toBeTruthy();
  });

  it('captures the runtime state', () => {
    const snap = StateSnapshot.create(RuntimeState.READY, workspace, []);
    expect(snap.runtimeState).toBe(RuntimeState.READY);
  });

  it('freezes the workspace in the snapshot', () => {
    const snap = StateSnapshot.create(RuntimeState.READY, workspace, []);
    expect(Object.isFrozen(snap.workspace)).toBe(true);
  });

  it('exposes a serializable JSON representation', () => {
    const snap = StateSnapshot.create(RuntimeState.READY, workspace, []);
    const json = snap.toJSON();
    expect(json.id).toBe(snap.id);
    expect(json.runtimeState).toBe(RuntimeState.READY);
  });
});
