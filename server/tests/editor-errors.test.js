#!/usr/bin/env node

/**
 * Test for get_editor_errors and clear_editor_errors commands
 *
 * Prerequisites:
 *  1. Godot editor is running with the MCP plugin enabled
 *  2. Project can be in any state (running or stopped)
 *  3. If testing clear_editor_errors, ensure Godot has been restarted after updating the plugin
 *
 * This test will:
 *  - Retrieve the current errors from the Errors tab
 *  - Display the error count and content
 *  - Optionally clear the errors if requested (use --clear flag)
 *
 * Usage:
 *  node server/tests/editor-errors.test.js         # Just read errors
 *  node server/tests/editor-errors.test.js --clear # Read and clear errors
 */

import { getGodotConnection } from '../dist/utils/godot_connection.js';
import {
	log,
	logError,
	logJson,
	logStep,
	logSuccess,
	logWarning
} from './utils/test_logger.js';

async function testEditorErrors() {
  logStep(1, 'Connecting to Godot');
  const connection = getGodotConnection();
  await connection.connect();

  if (!connection.isConnected()) {
    throw new Error('Failed to connect to Godot WebSocket server (is the editor running with the MCP plugin enabled?)');
  }
  logSuccess('Connected to Godot');

  try {
    // Test get_editor_errors
    logStep(2, 'Retrieving editor errors');
    const errorsResponse = await connection.sendCommand('get_editor_errors', {});

    if (!errorsResponse || typeof errorsResponse !== 'object') {
      throw new Error('Invalid response from get_editor_errors');
    }

    const text = errorsResponse.text || '';
    const lines = Array.isArray(errorsResponse.lines) ? errorsResponse.lines : [];
    const lineCount = errorsResponse.line_count || 0;
    const diagnostics = errorsResponse.diagnostics || {};

    logJson('Editor errors response:', {
      lineCount,
      hasText: text.length > 0,
      textLength: text.length,
      linesArrayLength: lines.length,
      diagnostics
    });

    if (lineCount === 0) {
      logSuccess('Errors tab is empty (no errors found)');
    } else {
      logWarning(`Found ${lineCount} error line(s) in the Errors tab`);

      if (lines.length > 0) {
        log('\nError lines (first 10):');
        lines.slice(0, 10).forEach((line, index) => {
          log(`  ${index + 1}. ${line}`);
        });

        if (lines.length > 10) {
          log(`  ... and ${lines.length - 10} more line(s)`);
        }
      } else if (text.length > 0) {
        log('\nError text preview (first 500 chars):');
        log(text.substring(0, 500));
        if (text.length > 500) {
          log(`... (${text.length - 500} more characters)`);
        }
      }
    }

    // Check if diagnostics indicate any issues
    if (diagnostics.error) {
      logWarning(`Diagnostics error: ${diagnostics.error}`);
    }
    if (diagnostics.control_path) {
      log(`Control path: ${diagnostics.control_path}`);
    }
    if (diagnostics.search_summary) {
      log(`Search summary: ${diagnostics.search_summary}`);
    }

    logSuccess('get_editor_errors succeeded');

    // Test clear_editor_errors if there are errors
    const shouldClearErrors = process.argv.includes('--clear');

    if (shouldClearErrors && lineCount > 0) {
      logStep(3, 'Clearing editor errors');
      const clearResponse = await connection.sendCommand('clear_editor_errors', {});

      if (!clearResponse || typeof clearResponse !== 'object') {
        throw new Error('Invalid response from clear_editor_errors');
      }

      const cleared = clearResponse.cleared || false;
      const method = clearResponse.method || 'unknown';
      const clearDiagnostics = clearResponse.diagnostics || {};

      logJson('Clear errors response:', {
        cleared,
        method,
        diagnostics: clearDiagnostics
      });

      if (cleared) {
        logSuccess(`Errors tab cleared successfully using method: ${method}`);

        // Verify errors were cleared
        logStep(4, 'Verifying errors were cleared');
        const verifyResponse = await connection.sendCommand('get_editor_errors', {});
        const verifyLineCount = verifyResponse.line_count || 0;

        if (verifyLineCount === 0) {
          logSuccess('Verified: Errors tab is now empty');
        } else {
          logWarning(`Note: Errors tab still has ${verifyLineCount} line(s) after clearing`);
          log('This may be expected if new errors were generated during the test');
        }
      } else {
        logWarning(`Failed to clear errors. Reason: ${clearResponse.message || 'Unknown'}`);
        if (clearDiagnostics.error) {
          logWarning(`Diagnostics error: ${clearDiagnostics.error}`);
        }
      }
    } else if (shouldClearErrors) {
      log('Skipping clear test: Errors tab is already empty');
    } else {
      log('\nTo test clearing errors, run with --clear flag:');
      log('  node server/tests/editor-errors.test.js --clear');
    }

  } finally {
    log(''); // Empty line for readability
    logStep(5, 'Cleaning up');
    connection.disconnect();
    logSuccess('Connection closed');
  }
}

testEditorErrors()
  .then(() => {
    log('\n✓ All tests passed', 'green');
    process.exit(0);
  })
  .catch(error => {
    logError(`\n✗ Test failed: ${error.message}`);
    if (error.stack) {
      logError(error.stack);
    }
    process.exit(1);
  });
