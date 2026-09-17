import { describe, it, expect } from 'vitest';
import {
  IssueStatus,
  FormalManifestationStatus,
  canTransitionIssue,
  canTransitionManifestation,
} from '../src/domain/state-machines.js';

describe('State Machines transitions', () => {
  it('should validate valid Issue status progression', () => {
    expect(canTransitionIssue(IssueStatus.DRAFT, IssueStatus.UNDER_MODERATION)).toBe(true);
    expect(canTransitionIssue(IssueStatus.UNDER_MODERATION, IssueStatus.OPEN)).toBe(true);
    expect(canTransitionIssue(IssueStatus.OPEN, IssueStatus.FORWARDED)).toBe(true);
    expect(canTransitionIssue(IssueStatus.FORWARDED, IssueStatus.AWAITING_RESPONSE)).toBe(true);
    expect(canTransitionIssue(IssueStatus.AWAITING_RESPONSE, IssueStatus.RESPONDED)).toBe(true);
    expect(canTransitionIssue(IssueStatus.RESPONDED, IssueStatus.RESOLVED)).toBe(true);
    expect(canTransitionIssue(IssueStatus.RESOLVED, IssueStatus.CLOSED)).toBe(true);
  });

  it('should reject invalid Issue status jumps', () => {
    // Cannot jump from DRAFT directly to RESOLVED
    expect(canTransitionIssue(IssueStatus.DRAFT, IssueStatus.RESOLVED)).toBe(false);
    // Cannot transition from ARCHIVED to OPEN
    expect(canTransitionIssue(IssueStatus.ARCHIVED, IssueStatus.OPEN)).toBe(false);
  });

  it('should validate FormalManifestation transitions', () => {
    expect(canTransitionManifestation(FormalManifestationStatus.DRAFT, FormalManifestationStatus.SUBMITTED)).toBe(true);
    expect(canTransitionManifestation(FormalManifestationStatus.SUBMITTED, FormalManifestationStatus.SANITIZATION_CHECK)).toBe(true);
    expect(canTransitionManifestation(FormalManifestationStatus.SANITIZATION_CHECK, FormalManifestationStatus.READY_FOR_CONFIRMATION)).toBe(true);
    expect(canTransitionManifestation(FormalManifestationStatus.READY_FOR_CONFIRMATION, FormalManifestationStatus.USER_CONFIRMED)).toBe(true);
    expect(canTransitionManifestation(FormalManifestationStatus.USER_CONFIRMED, FormalManifestationStatus.QUEUED_FOR_DISPATCH)).toBe(true);
    expect(canTransitionManifestation(FormalManifestationStatus.QUEUED_FOR_DISPATCH, FormalManifestationStatus.DISPATCHED)).toBe(true);
  });

  it('should reject invalid FormalManifestation skips', () => {
    // Cannot jump from DRAFT directly to DISPATCHED without user confirmation and sanitization
    expect(canTransitionManifestation(FormalManifestationStatus.DRAFT, FormalManifestationStatus.DISPATCHED)).toBe(false);
  });
});
