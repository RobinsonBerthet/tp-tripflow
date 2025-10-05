import * as SQLite from "expo-sqlite";
import { useCallback, useEffect, useMemo, useState } from "react";

export type QueryParams = Array<string | number | null>;

export type SQLStatement = { sql: string; params?: QueryParams };

export type UseSQLiteOptions = {
  schema?: string[]; // statements d'initialisation (CREATE TABLE IF NOT EXISTS ...)
  onInit?: (db: SQLite.SQLiteDatabase) => Promise<void> | void; // callback après init
};

// Verrous globaux pour sérialiser l'application des schémas par base
const initPromisesByDb = new Map<string, Promise<void>>();
const initializedDbs = new Set<string>();

export function useSQLite(dbName = "tripflow.db", options?: UseSQLiteOptions) {
  const db = useMemo(() => SQLite.openDatabaseSync(dbName), [dbName]);
  const hasSchema = Boolean(options?.schema && options.schema.length > 0);
  const shouldInit = hasSchema || Boolean(options?.onInit);
  const [ready, setReady] = useState<boolean>(!shouldInit);

  const waitForInitIfNeeded = useCallback(async () => {
    // Si une initialisation est en cours pour cette base, attendre qu'elle se termine
    const pending = initPromisesByDb.get(dbName);
    if (pending) {
      await pending;
    }
  }, [dbName]);

  const run = useCallback(
    async (sql: string, params: QueryParams = []) => {
      await waitForInitIfNeeded();
      const res = await db.runAsync(sql, params);
      return {
        rowsAffected: res.changes,
        insertId: (res as any).lastInsertRowId as number | undefined,
      };
    },
    [db, waitForInitIfNeeded]
  );

  const queryAll = useCallback(
    async <T = any>(sql: string, params: QueryParams = []) => {
      await waitForInitIfNeeded();
      const rows = await db.getAllAsync<T>(sql, params);
      return rows;
    },
    [db, waitForInitIfNeeded]
  );

  const queryOne = useCallback(
    async <T = any>(sql: string, params: QueryParams = []) => {
      await waitForInitIfNeeded();
      const row = await db.getFirstAsync<T>(sql, params);
      return (row ?? null) as T | null;
    },
    [db, waitForInitIfNeeded]
  );

  const transaction = useCallback(
    async (statements: SQLStatement[]): Promise<void> => {
      // Transaction peut être utilisée par l'init elle-même. Éviter d'attendre ici
      // pour ne pas créer de deadlock si déjà dans l'init.
      await db.withTransactionAsync(async () => {
        for (const { sql, params } of statements) {
          await db.runAsync(sql, params ?? []);
        }
      });
    },
    [db]
  );

  const init = useCallback(async () => {
    if (!shouldInit) return;

    // Déjà initialisée pour cette base
    if (initializedDbs.has(dbName)) return;

    // Attendre une éventuelle initialisation en cours puis sortir
    const pending = initPromisesByDb.get(dbName);
    if (pending) {
      await pending;
      return;
    }

    // Lancer une seule initialisation concurrent-safe
    const initPromise = (async () => {
      try {
        if (hasSchema) {
          // Exécuter les DDL sans transaction explicite pour éviter les rollback implicites
          const sql = (options!.schema as string[])
            .map((s) => {
              const trimmed = s.trim();
              return trimmed.endsWith(";") ? trimmed : `${trimmed};`;
            })
            .join(" ");
          if (sql.length > 0) {
            await db.execAsync(sql);
          }
        }
        if (options?.onInit) await options.onInit(db);
        initializedDbs.add(dbName);
      } finally {
        initPromisesByDb.delete(dbName);
      }
    })();

    initPromisesByDb.set(dbName, initPromise);
    await initPromise;
  }, [db, dbName, hasSchema, options, shouldInit, transaction]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        await init();
      } finally {
        if (!cancelled) setReady(true);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [init]);

  return {
    db,
    ready,
    run,
    queryAll,
    queryOne,
    transaction,
  } as const;
}

export default useSQLite;
