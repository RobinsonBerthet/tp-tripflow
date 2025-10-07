import * as SQLite from "expo-sqlite";
import { useCallback, useEffect, useRef, useState } from "react";

export type QueryParams = Array<string | number | null>;

export type SQLStatement = { sql: string; params?: QueryParams };

export type UseSQLiteOptions = {
  schema?: string[]; // statements d'initialisation (CREATE TABLE IF NOT EXISTS ...)
  onInit?: (db: SQLite.SQLiteDatabase) => Promise<void> | void; // callback après init
};

// Verrous globaux pour sérialiser l'application des schémas par base
const initPromisesByDb = new Map<string, Promise<void>>();

// Normalise les paramètres passés aux requêtes pour éviter les undefined côté natif
function normalizeParams(
  params: Array<unknown>
): Array<string | number | null> {
  return params.map((p) => (p === undefined ? null : (p as any))) as Array<
    string | number | null
  >;
}

export function useSQLite(dbName = "tripflow.db", options?: UseSQLiteOptions) {
  const dbRef = useRef<SQLite.SQLiteDatabase | null>(null);
  const hasSchema = Boolean(options?.schema && options.schema.length > 0);
  const shouldInit = hasSchema || Boolean(options?.onInit);
  const [ready, setReady] = useState<boolean>(false);

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
      const db = dbRef.current;
      if (!db) throw new Error("Database not initialized");
      const res = await db.runAsync(sql, normalizeParams(params));
      return {
        rowsAffected: res.changes,
        insertId: (res as any).lastInsertRowId as number | undefined,
      };
    },
    [waitForInitIfNeeded]
  );

  const queryAll = useCallback(
    async <T = any>(sql: string, params: QueryParams = []) => {
      await waitForInitIfNeeded();
      const db = dbRef.current;
      if (!db) throw new Error("Database not initialized");
      const rows = await db.getAllAsync<T>(sql, normalizeParams(params));
      return rows;
    },
    [waitForInitIfNeeded]
  );

  const queryOne = useCallback(
    async <T = any>(sql: string, params: QueryParams = []) => {
      await waitForInitIfNeeded();
      const db = dbRef.current;
      if (!db) throw new Error("Database not initialized");
      const row = await db.getFirstAsync<T>(sql, normalizeParams(params));
      return (row ?? null) as T | null;
    },
    [waitForInitIfNeeded]
  );

  const transaction = useCallback(
    async (statements: SQLStatement[]): Promise<void> => {
      // Transaction peut être utilisée par l'init elle-même. Éviter d'attendre ici
      // pour ne pas créer de deadlock si déjà dans l'init.
      const db = dbRef.current;
      if (!db) throw new Error("Database not initialized");
      await db.withTransactionAsync(async () => {
        for (const { sql, params } of statements) {
          await db.runAsync(sql, normalizeParams(params ?? []));
        }
      });
    },
    []
  );

  const init = useCallback(async () => {
    // Attendre une éventuelle initialisation en cours puis sortir
    const pending = initPromisesByDb.get(dbName);
    if (pending) {
      await pending;
      return;
    }

    // Lancer une seule initialisation concurrent-safe
    const initPromise = (async () => {
      try {
        // Ouvrir une nouvelle connexion explicitement pour contourner les soucis Android
        const openedDb = await SQLite.openDatabaseAsync(dbName, {
          useNewConnection: true,
        } as any);
        dbRef.current = openedDb;

        if (hasSchema && options?.schema) {
          for (const stmt of options.schema) {
            const trimmed = stmt.trim();
            if (trimmed.length === 0) continue;
            const sql = trimmed.endsWith(";") ? trimmed : `${trimmed};`;
            await openedDb.execAsync(sql);
          }
        }
        if (options?.onInit) await options.onInit(openedDb);
      } finally {
        initPromisesByDb.delete(dbName);
      }
    })();

    initPromisesByDb.set(dbName, initPromise);
    await initPromise;
  }, [dbName, hasSchema, options]);

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
    db: dbRef.current as SQLite.SQLiteDatabase | null,
    ready,
    run,
    queryAll,
    queryOne,
    transaction,
  } as const;
}

export default useSQLite;
