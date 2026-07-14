import { describe, it, expect } from 'vitest';
import { StateTransitionGuard } from '../../src/state/StateTransitionGuard.js';
import { RuntimeState } from '../../src/kernel/RuntimeState.js';

describe('StateTransitionGuard', () => {
  const guard = new StateTransitionGuard();

  describe('valid transitions', () => {
    it('allows CREATED → BOOTING', () => {
      expect(() => guard.assertCanTransition(RuntimeState.CREATED, RuntimeState.BOOTING)).not.toThrow();
    });
    it('allows BOOTING → READY', () => {
      expect(() => guard.assertCanTransition(RuntimeState.BOOTING, RuntimeState.READY)).not.toThrow();
    });
    it('allows READY → STOPPING', () => {
      expect(() => guard.assertCanTransition(RuntimeState.READY, RuntimeState.STOPPING)).not.toThrow();
    });
    it('allows STOPPING → STOPPED', () => {
      expect(() => guard.assertCanTransition(RuntimeState.STOPPING, RuntimeState.STOPPED)).not.toThrow();
    });
    it('allows any state → FAILED', () => {
      for (const state of Object.values(RuntimeState)) {
        expect(() => guard.assertCanTransition(state as RuntimeState, RuntimeState.FAILED)).not.toThrow();
      }
    });
  });

  describe('invalid transitions', () => {
    it('rejects READY → CREATED', () => {
      expect(() => guard.assertCanTransition(RuntimeState.READY, RuntimeState.CREATED)).toThrow(
        /Invalid state transition/
      );
    });
    it('rejects STOPPED → BOOTING', () => {
      expect(() => guard.assertCanTransition(RuntimeState.STOPPED, RuntimeState.BOOTING)).toThrow(
        /Invalid state transition/
      );
    });
    it('rejects STOPPED → READY', () => {
      expect(() => guard.assertCanTransition(RuntimeState.STOPPED, RuntimeState.READY)).toThrow(
        /Invalid state transition/
      );
    });
    it('rejects CREATED → STOPPED', () => {
      expect(() => guard.assertCanTransition(RuntimeState.CREATED, RuntimeState.STOPPED)).toThrow(
        /Invalid state transition/
      );
    });
    it('rejects READY → BOOTING', () => {
      expect(() => guard.assertCanTransition(RuntimeState.READY, RuntimeState.BOOTING)).toThrow(
        /Invalid state transition/
      );
    });
  });

  describe('transition()', () => {
    it('returns the new state on a valid transition', () => {
      expect(guard.transition(RuntimeState.CREATED, RuntimeState.BOOTING)).toBe(RuntimeState.BOOTING);
    });
    it('throws on an invalid transition', () => {
      expect(() => guard.transition(RuntimeState.STOPPED, RuntimeState.READY)).toThrow();
    });
  });
});
