import Database from 'better-sqlite3';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
const DB_PATH = 'printers.db';
const DATA_DIR = join(process.cwd(), 'data', 'printers');
function createDatabase() {
    const db = new Database(DB_PATH);
    // Enable WAL mode for better concurrent access
    db.pragma('journal_mode = WAL');
    // Create main printers table
    db.exec(`
    CREATE TABLE IF NOT EXISTS printers (
      id TEXT PRIMARY KEY,
      manufacturer TEXT NOT NULL,
      model TEXT NOT NULL,
      series TEXT,
      formFactor TEXT NOT NULL,
      type TEXT NOT NULL,
      color INTEGER NOT NULL,
      functions TEXT NOT NULL,
      data TEXT NOT NULL,
      searchText TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_manufacturer ON printers(manufacturer);
    CREATE INDEX IF NOT EXISTS idx_formFactor ON printers(formFactor);
    CREATE INDEX IF NOT EXISTS idx_type ON printers(type);
    CREATE INDEX IF NOT EXISTS idx_color ON printers(color);
    CREATE VIRTUAL TABLE IF NOT EXISTS printers_fts USING fts5(
      id, manufacturer, model, series, searchText,
      content='printers',
      content_rowid='rowid'
    );

    -- Triggers to keep FTS index in sync
    CREATE TRIGGER IF NOT EXISTS printers_ai AFTER INSERT ON printers BEGIN
      INSERT INTO printers_fts(rowid, id, manufacturer, model, series, searchText)
      VALUES (new.rowid, new.id, new.manufacturer, new.model, new.series, new.searchText);
    END;

    CREATE TRIGGER IF NOT EXISTS printers_ad AFTER DELETE ON printers BEGIN
      INSERT INTO printers_fts(printers_fts, rowid, id, manufacturer, model, series, searchText)
      VALUES('delete', old.rowid, old.id, old.manufacturer, old.model, old.series, old.searchText);
    END;

    CREATE TRIGGER IF NOT EXISTS printers_au AFTER UPDATE ON printers BEGIN
      INSERT INTO printers_fts(printers_fts, rowid, id, manufacturer, model, series, searchText)
      VALUES('delete', old.rowid, old.id, old.manufacturer, old.model, old.series, old.searchText);
      INSERT INTO printers_fts(rowid, id, manufacturer, model, series, searchText)
      VALUES (new.rowid, new.id, new.manufacturer, new.model, new.series, new.searchText);
    END;
  `);
    return db;
}
function buildSearchText(printer) {
    const parts = [
        printer.manufacturer,
        printer.model,
        printer.series || '',
        printer.formFactor,
        printer.type,
        ...printer.functions,
        ...printer.sales.targetMarket,
        ...printer.sales.sellingPoints,
        ...printer.sales.idealFor,
    ];
    return parts.filter(Boolean).join(' ').toLowerCase();
}
function loadPrinters() {
    const printers = [];
    try {
        const files = readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
        for (const file of files) {
            const filePath = join(DATA_DIR, file);
            const content = readFileSync(filePath, 'utf-8');
            const printer = JSON.parse(content);
            printers.push(printer);
            console.log(`Loaded: ${printer.manufacturer} ${printer.model}`);
        }
    }
    catch (error) {
        console.error('Error loading printer data:', error);
        throw error;
    }
    return printers;
}
function insertPrinters(db, printers) {
    const stmt = db.prepare(`
    INSERT OR REPLACE INTO printers
    (id, manufacturer, model, series, formFactor, type, color, functions, data, searchText)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
    const insertMany = db.transaction((printers) => {
        for (const printer of printers) {
            stmt.run(printer.id, printer.manufacturer, printer.model, printer.series || null, printer.formFactor, printer.type, printer.color ? 1 : 0, JSON.stringify(printer.functions), JSON.stringify(printer), buildSearchText(printer));
        }
    });
    insertMany(printers);
}
function main() {
    console.log('Building printer database...');
    console.log(`Database path: ${DB_PATH}`);
    console.log(`Data directory: ${DATA_DIR}`);
    const db = createDatabase();
    const printers = loadPrinters();
    console.log(`\nInserting ${printers.length} printers into database...`);
    insertPrinters(db, printers);
    // Verify
    const count = db.prepare('SELECT COUNT(*) as count FROM printers').get();
    console.log(`\nDatabase built successfully!`);
    console.log(`Total printers in database: ${count.count}`);
    db.close();
}
main();
//# sourceMappingURL=build-database.js.map