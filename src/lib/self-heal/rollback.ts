/**
 * Self-Heal Rollback System
 * 
 * Generates rollback patches for all repair actions
 */

import { RollbackPatch, RepairAction } from './types';

/**
 * Generate a rollback patch from repair actions
 */
export function generateRollbackPatch(repairs: RepairAction[]): RollbackPatch {
  const commands: string[] = [];
  const sqlStatements: string[] = [];
  
  for (const repair of repairs) {
    if (repair.rollbackCommand && repair.status === 'success') {
      // Separate SQL statements from bash commands
      if (repair.rollbackCommand.includes('INSERT') || 
          repair.rollbackCommand.includes('UPDATE') || 
          repair.rollbackCommand.includes('DELETE')) {
        sqlStatements.push(`-- Rollback for: ${repair.description}`);
        sqlStatements.push(repair.rollbackCommand);
        sqlStatements.push('');
      } else if (!repair.rollbackCommand.includes('does not require rollback')) {
        commands.push(`# Rollback for: ${repair.description}`);
        commands.push(repair.rollbackCommand);
        commands.push('');
      }
    }
  }

  // Add header to commands
  if (commands.length > 0) {
    commands.unshift('#!/bin/bash');
    commands.unshift('# Self-Heal Rollback Script');
    commands.unshift(`# Generated: ${new Date().toISOString()}`);
    commands.unshift('# Execute this script to rollback self-heal repairs');
    commands.unshift('');
  }

  // Add header to SQL statements
  if (sqlStatements.length > 0) {
    sqlStatements.unshift('-- Self-Heal Rollback SQL');
    sqlStatements.unshift(`-- Generated: ${new Date().toISOString()}`);
    sqlStatements.unshift('-- Execute these statements to rollback database changes');
    sqlStatements.unshift('');
  }

  let description = 'Rollback patch for self-heal repairs:\n';
  const successfulRepairs = repairs.filter(r => r.status === 'success');
  
  if (successfulRepairs.length === 0) {
    description += 'No successful repairs to rollback';
  } else {
    description += successfulRepairs.map(r => `- ${r.description}`).join('\n');
  }

  return {
    commands,
    sqlStatements,
    description,
  };
}

/**
 * Format rollback patch as a string for storage
 */
export function formatRollbackPatch(patch: RollbackPatch): string {
  const sections: string[] = [];

  sections.push('='.repeat(80));
  sections.push('SELF-HEAL ROLLBACK PATCH');
  sections.push(`Generated: ${new Date().toISOString()}`);
  sections.push('='.repeat(80));
  sections.push('');
  sections.push('DESCRIPTION:');
  sections.push(patch.description);
  sections.push('');

  if (patch.commands.length > 0) {
    sections.push('='.repeat(80));
    sections.push('BASH COMMANDS:');
    sections.push('='.repeat(80));
    sections.push('');
    sections.push(patch.commands.join('\n'));
    sections.push('');
  }

  if (patch.sqlStatements.length > 0) {
    sections.push('='.repeat(80));
    sections.push('SQL STATEMENTS:');
    sections.push('='.repeat(80));
    sections.push('');
    sections.push(patch.sqlStatements.join('\n'));
    sections.push('');
  }

  if (patch.commands.length === 0 && patch.sqlStatements.length === 0) {
    sections.push('No rollback actions required.');
    sections.push('All repairs were either skipped or do not require rollback.');
  }

  sections.push('='.repeat(80));
  sections.push('END OF ROLLBACK PATCH');
  sections.push('='.repeat(80));

  return sections.join('\n');
}
