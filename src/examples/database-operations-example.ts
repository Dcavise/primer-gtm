/**
 * Database Operations Example
 * 
 * This file demonstrates how to use the database operations utility
 * for executing SQL queries against the Supabase database.
 */

import { db, DatabaseMode } from '@/utils/database-operations';
import { logger } from '@/utils/logger';

/**
 * Example function demonstrating how to use the database operations utility
 * for read-only operations
 */
export async function exampleReadOperations() {
  try {
    logger.info('Running example read operations...');
    
    // Example 1: Simple SELECT query
    const campusesResult = await db.select('SELECT * FROM campuses LIMIT 10');
    
    if (campusesResult.success) {
      logger.info(`Retrieved ${campusesResult.rowCount} campuses in ${campusesResult.executionTime}ms`);
      logger.info('First campus:', campusesResult.data?.[0]);
    } else {
      logger.error('Error retrieving campuses:', campusesResult.error);
    }
    
    // Example 2: SELECT query with parameters
    const fellowsResult = await db.select(
      'SELECT * FROM fellows WHERE campus_id = $1 LIMIT $2',
      ['austin', 5]
    );
    
    if (fellowsResult.success) {
      logger.info(`Retrieved ${fellowsResult.rowCount} fellows in ${fellowsResult.executionTime}ms`);
    } else {
      logger.error('Error retrieving fellows:', fellowsResult.error);
    }
    
    // Example 3: Using the generic execute method for a SELECT query
    const profilesResult = await db.execute('SELECT * FROM profiles LIMIT 5');
    
    if (profilesResult.success) {
      logger.info(`Retrieved ${profilesResult.data?.length} profiles in ${profilesResult.executionTime}ms`);
    } else {
      logger.error('Error retrieving profiles:', profilesResult.error);
    }
    
    return {
      campuses: campusesResult,
      fellows: fellowsResult,
      profiles: profilesResult
    };
  } catch (error) {
    logger.error('Error in exampleReadOperations:', error);
    throw error;
  }
}

/**
 * Example function demonstrating how to use the database operations utility
 * for write operations
 */
export async function exampleWriteOperations() {
  try {
    logger.info('Running example write operations...');
    
    // First, enable unsafe mode
    const enableResult = await db.enableUnsafeMode();
    
    if (!enableResult.success) {
      logger.error('Failed to enable unsafe mode:', enableResult.error);
      return { success: false, error: enableResult.error };
    }
    
    logger.info(`Unsafe mode enabled in ${enableResult.executionTime}ms`);
    
    // Example 1: INSERT query
    const insertResult = await db.modify(
      `INSERT INTO profiles (id, email, full_name, created_at, updated_at) 
       VALUES ($1, $2, $3, NOW(), NOW()) 
       RETURNING id`,
      [
        'test-user-id',
        'test@example.com',
        'Test User'
      ]
    );
    
    if (insertResult.success) {
      logger.info(`Inserted profile with ID: ${insertResult.data?.id} in ${insertResult.executionTime}ms`);
    } else {
      logger.error('Error inserting profile:', insertResult.error);
    }
    
    // Example 2: UPDATE query
    const updateResult = await db.modify(
      `UPDATE profiles 
       SET full_name = $1, updated_at = NOW() 
       WHERE id = $2 
       RETURNING id`,
      ['Updated Test User', 'test-user-id']
    );
    
    if (updateResult.success) {
      logger.info(`Updated profile with ID: ${updateResult.data?.id} in ${updateResult.executionTime}ms`);
    } else {
      logger.error('Error updating profile:', updateResult.error);
    }
    
    // Example 3: DELETE query
    const deleteResult = await db.modify(
      `DELETE FROM profiles 
       WHERE id = $1 
       RETURNING id`,
      ['test-user-id']
    );
    
    if (deleteResult.success) {
      logger.info(`Deleted profile with ID: ${deleteResult.data?.id} in ${deleteResult.executionTime}ms`);
    } else {
      logger.error('Error deleting profile:', deleteResult.error);
    }
    
    // Finally, disable unsafe mode
    const disableResult = await db.disableUnsafeMode();
    
    if (!disableResult.success) {
      logger.error('Failed to disable unsafe mode:', disableResult.error);
    } else {
      logger.info(`Unsafe mode disabled in ${disableResult.executionTime}ms`);
    }
    
    return {
      insert: insertResult,
      update: updateResult,
      delete: deleteResult
    };
  } catch (error) {
    logger.error('Error in exampleWriteOperations:', error);
    
    // Make sure to disable unsafe mode even if an error occurs
    try {
      await db.disableUnsafeMode();
    } catch (disableError) {
      logger.error('Error disabling unsafe mode after error:', disableError);
    }
    
    throw error;
  }
}

/**
 * Example function demonstrating how to use the database operations utility
 * for DDL operations with transaction control
 */
export async function exampleDDLOperations() {
  try {
    logger.info('Running example DDL operations...');
    
    // First, enable unsafe mode
    const enableResult = await db.enableUnsafeMode();
    
    if (!enableResult.success) {
      logger.error('Failed to enable unsafe mode:', enableResult.error);
      return { success: false, error: enableResult.error };
    }
    
    logger.info(`Unsafe mode enabled in ${enableResult.executionTime}ms`);
    
    // Example: Create a table and add an index in a transaction
    const ddlQueries = [
      `CREATE TABLE IF NOT EXISTS test_table (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,
      `CREATE INDEX IF NOT EXISTS idx_test_table_name ON test_table (name)`
    ];
    
    const ddlResult = await db.ddl(ddlQueries);
    
    if (ddlResult.success) {
      logger.info(`DDL operations completed in ${ddlResult.executionTime}ms`);
      
      // Insert some test data
      const insertResult = await db.modify(
        `INSERT INTO test_table (name) VALUES ($1), ($2), ($3) RETURNING id, name`,
        ['Test 1', 'Test 2', 'Test 3']
      );
      
      if (insertResult.success) {
        logger.info(`Inserted test data: ${JSON.stringify(insertResult.data)}`);
        
        // Query the test data
        const queryResult = await db.select('SELECT * FROM test_table');
        
        if (queryResult.success) {
          logger.info(`Retrieved test data: ${JSON.stringify(queryResult.data)}`);
        }
        
        // Clean up by dropping the test table
        const dropResult = await db.ddl([`DROP TABLE IF EXISTS test_table`]);
        
        if (dropResult.success) {
          logger.info(`Test table dropped in ${dropResult.executionTime}ms`);
        } else {
          logger.error('Error dropping test table:', dropResult.error);
        }
      } else {
        logger.error('Error inserting test data:', insertResult.error);
      }
    } else {
      logger.error('Error executing DDL operations:', ddlResult.error);
    }
    
    // Finally, disable unsafe mode
    const disableResult = await db.disableUnsafeMode();
    
    if (!disableResult.success) {
      logger.error('Failed to disable unsafe mode:', disableResult.error);
    } else {
      logger.info(`Unsafe mode disabled in ${disableResult.executionTime}ms`);
    }
    
    return { success: ddlResult.success, error: ddlResult.error };
  } catch (error) {
    logger.error('Error in exampleDDLOperations:', error);
    
    // Make sure to disable unsafe mode even if an error occurs
    try {
      await db.disableUnsafeMode();
    } catch (disableError) {
      logger.error('Error disabling unsafe mode after error:', disableError);
    }
    
    throw error;
  }
}

/**
 * Example function demonstrating how to use the database operations utility
 * with automatic unsafe mode handling
 */
export async function exampleAutoUnsafeMode() {
  try {
    logger.info('Running example with automatic unsafe mode handling...');
    
    // Example 1: Write operation with automatic unsafe mode handling
    const insertResult = await db.execute(
      `INSERT INTO profiles (id, email, full_name, created_at, updated_at) 
       VALUES ($1, $2, $3, NOW(), NOW()) 
       RETURNING id`,
      [
        'auto-test-user-id',
        'auto-test@example.com',
        'Auto Test User'
      ],
      { autoEnableUnsafe: true }
    );
    
    if (insertResult.success) {
      logger.info(`Inserted profile with ID: ${insertResult.data?.id} in ${insertResult.executionTime}ms`);
      
      // Clean up
      const deleteResult = await db.execute(
        `DELETE FROM profiles WHERE id = $1 RETURNING id`,
        ['auto-test-user-id'],
        { autoEnableUnsafe: true }
      );
      
      if (deleteResult.success) {
        logger.info(`Deleted profile with ID: ${deleteResult.data?.id} in ${deleteResult.executionTime}ms`);
      }
    } else {
      logger.error('Error with automatic unsafe mode:', insertResult.error);
    }
    
    // Make sure unsafe mode is disabled at the end
    if (db.getMode() === DatabaseMode.UNSAFE) {
      await db.disableUnsafeMode();
    }
    
    return { success: true };
  } catch (error) {
    logger.error('Error in exampleAutoUnsafeMode:', error);
    
    // Make sure to disable unsafe mode even if an error occurs
    if (db.getMode() === DatabaseMode.UNSAFE) {
      try {
        await db.disableUnsafeMode();
      } catch (disableError) {
        logger.error('Error disabling unsafe mode after error:', disableError);
      }
    }
    
    throw error;
  }
} 