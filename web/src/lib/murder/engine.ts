import type { MurderQueryResult, MurderWorkerRequest, MurderWorkerResponse } from "./query.ts";
export type { MurderQueryResult, MurderQuerySet } from "./query.ts";

export const MURDER_QUERY_TIMEOUT_MS = 3_000;

export function createMurderEngine() {
  let worker: Worker | null = null;
  let workerReady = false;
  let disposed = false;
  let sequence = 0;
  let pending: { id: number; resolve: (result: MurderQueryResult) => void; reject: (error: Error) => void; timer: ReturnType<typeof setTimeout> } | null = null;

  function stopWorker(message: string) {
    worker?.terminate();
    worker = null;
    workerReady = false;
    if (pending) {
      clearTimeout(pending.timer);
      pending.reject(new Error(message));
      pending = null;
    }
  }

  function getWorker(): Worker {
    if (worker) return worker;
    worker = new Worker(new URL("../../workers/murder.worker.ts", import.meta.url), { type: "module" });
    worker.onmessage = (event: MessageEvent<MurderWorkerResponse>) => {
      if (event.data.ready) {
        workerReady = true;
        if (pending) {
          clearTimeout(pending.timer);
          pending.timer = setTimeout(() => stopWorker("Forespørgslen tog mere end 3 sekunder og blev stoppet. Begræns resultatet eller brug mere præcise filtre, og prøv igen."), MURDER_QUERY_TIMEOUT_MS);
        }
        return;
      }
      if (!pending || event.data.id !== pending.id) return;
      if (event.data.fatal) {
        stopWorker(event.data.error || "SQL-databasen kunne ikke indlæses. Prøv igen for at starte en ny database.");
        return;
      }
      const current = pending;
      pending = null;
      clearTimeout(current.timer);
      if (event.data.error) current.reject(new Error(event.data.error));
      else if (event.data.result) current.resolve(event.data.result);
      else current.reject(new Error("Databasen returnerede ikke et resultat. Prøv igen."));
    };
    worker.onerror = (event) => {
      event.preventDefault();
      stopWorker("SQL-databasen kunne ikke indlæses eller blev afbrudt. Prøv igen; sagen starter med de samme data.");
    };
    worker.onmessageerror = () => stopWorker("Resultatet kunne ikke læses. Prøv en mindre forespørgsel.");
    return worker;
  }

  return {
    run(sql: string): Promise<MurderQueryResult> {
      if (disposed) return Promise.reject(new Error("Databasen er lukket."));
      if (pending) return Promise.reject(new Error("En forespørgsel kører allerede. Vent på resultatet."));
      return new Promise((resolve, reject) => {
        try {
          const activeWorker = getWorker();
          const id = ++sequence;
          const timer = setTimeout(
            () => stopWorker(workerReady
              ? "Forespørgslen tog mere end 3 sekunder og blev stoppet. Begræns resultatet eller brug mere præcise filtre, og prøv igen."
              : "SQL-databasen kunne ikke indlæses inden for 15 sekunder. Kontroller forbindelsen, og prøv igen."),
            workerReady ? MURDER_QUERY_TIMEOUT_MS : 15_000,
          );
          pending = { id, resolve, reject, timer };
          activeWorker.postMessage({ id, sql } satisfies MurderWorkerRequest);
        } catch {
          stopWorker("SQL-databasen kunne ikke startes. Genindlæs siden, og prøv igen.");
          reject(new Error("SQL-databasen kunne ikke startes. Genindlæs siden, og prøv igen."));
        }
      });
    },
    dispose() {
      disposed = true;
      stopWorker("SQL-databasen er lukket.");
    },
  };
}
