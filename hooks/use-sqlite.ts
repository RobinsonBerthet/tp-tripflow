import * as SQLite from "expo-sqlite";
import { useCallback, useEffect, useMemo } from "react";

export type QueryParams = Array<string | number | null>;

export type SQLStatement = { sql: string; params?: QueryParams };

export type UseSQLiteOptions = {
  schema?: string[]; // statements d'initialisation (CREATE TABLE IF NOT EXISTS ...)
  onInit?: (db: SQLite.SQLiteDatabase) => Promise<void> | void; // callback après init
};

// Verrous globaux pour éviter les initialisations concurrentes par base
const initPromisesByDb = new Map<string, Promise<void>>();
const initializedDbs = new Set<string>();

export function useSQLite(dbName = "tripflow.db", options?: UseSQLiteOptions) {
  const db = useMemo(() => SQLite.openDatabaseSync(dbName), [dbName]);
  const hasSchema = Boolean(options?.schema && options.schema.length > 0);

  const run = useCallback(
    async (sql: string, params: QueryParams = []) => {
      const res = await db.runAsync(sql, params);
      return {
        rowsAffected: res.changes,
        insertId: (res as any).lastInsertRowId as number | undefined,
      };
    },
    [db]
  );

  const queryAll = useCallback(
    async <T = any>(sql: string, params: QueryParams = []) => {
      const rows = await db.getAllAsync<T>(sql, params);
      return rows;
    },
    [db]
  );

  const queryOne = useCallback(
    async <T = any>(sql: string, params: QueryParams = []) => {
      const row = await db.getFirstAsync<T>(sql, params);
      return (row ?? null) as T | null;
    },
    [db]
  );

  const transaction = useCallback(
    async (statements: SQLStatement[]): Promise<void> => {
      await db.withTransactionAsync(async () => {
        for (const { sql, params } of statements) {
          await db.runAsync(sql, params ?? []);
        }
      });
    },
    [db]
  );

  const init = useCallback(async () => {
    // Si aucune initialisation requise, sortir tôt
    if (!hasSchema && !options?.onInit) return;

    // Déjà initialisé pour cette base ?
    if (initializedDbs.has(dbName)) {
      if (options?.onInit) await options.onInit(db);
      return;
    }

    // Initialisation déjà en cours ? Attendre le verrou
    const pending = initPromisesByDb.get(dbName);
    if (pending) {
      await pending;
      if (options?.onInit) await options.onInit(db);
      return;
    }

    const initPromise = (async () => {
      try {
        if (hasSchema) {
          const stmts = (options!.schema as string[]).map((sql) => ({ sql }));
          await transaction(stmts);
        }
        initializedDbs.add(dbName);
      } finally {
        initPromisesByDb.delete(dbName);
      }
    })();

    initPromisesByDb.set(dbName, initPromise);
    await initPromise;

    if (options?.onInit) await options.onInit(db);
  }, [db, dbName, hasSchema, options, transaction]);

  useEffect(() => {
    // Initialise la base si un schéma est fourni
    void init();
  }, [init]);

  return {
    db,
    run,
    queryAll,
    queryOne,
    transaction,
  } as const;
}

export default useSQLite;
