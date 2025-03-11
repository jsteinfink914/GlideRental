import { pool } from './db';
import { log } from './vite';

async function inspectDatabase() {
  try {
    log('Connecting to database...', 'inspect');
    
    // Get all table names
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    log(`Found ${tablesResult.rows.length} tables:`, 'inspect');
    for (const row of tablesResult.rows) {
      log(`- ${row.table_name}`, 'inspect');
      
      // Get columns for this table
      const columnsResult = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position
      `, [row.table_name]);
      
      for (const col of columnsResult.rows) {
        log(`  * ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`, 'inspect');
      }
    }
    
    log('Database inspection complete', 'inspect');
  } catch (error) {
    log(`Error inspecting database: ${error}`, 'inspect');
  } finally {
    pool.end();
  }
}

inspectDatabase();
