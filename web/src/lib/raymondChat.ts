import { apiFetch } from "../auth";

export type RaymondChatHistoryItem = {
  role: "user" | "assistant";
  text: string;
};

export type RaymondChatRequest = {
  message: string;
  history: RaymondChatHistoryItem[];
  contentSlug?: string;
  currentSql?: string;
  lastError?: string;
  resultSummary?: string;
  checkMessages?: string[];
  checkPassed?: boolean;
  includeWork: boolean;
  path: string;
};

export type RaymondChatSource = {
  slug: string;
  title: string;
  kind: string;
};

export type RaymondChatResponse = {
  reply: string;
  sources: RaymondChatSource[];
  context: {
    lessonTitle?: string;
    includesWork: boolean;
    recentQueries: number;
  };
  model: string;
};

export type RaymondChatError = Error & { status?: number };

/** Server-provided errors are shown only for validation; provider details stay private. */
export function raymondChatErrorMessage(error: unknown): string {
  const status = (error as RaymondChatError | undefined)?.status;
  if (status === 401) return "Din session er udløbet. Log ind igen for at spørge Raymond.";
  if (status === 429) return "Raymond har travlt. Vent et øjeblik, og prøv igen.";
  if (status === 503) return "Raymond er ikke tilgængelig lige nu. Du kan stadig bruge guiden og SQL-hjælpen.";
  if (status === 400 && error instanceof Error) return error.message;
  return "Raymond kunne ikke svare lige nu. Prøv igen om lidt. Dit spørgsmål er bevaret.";
}

export async function sendRaymondChat(
  request: RaymondChatRequest,
  signal: AbortSignal,
): Promise<RaymondChatResponse> {
  const response = await apiFetch("/raymond/chat", {
    method: "POST",
    body: JSON.stringify(request),
    signal,
  });
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const serverMessage = data && typeof data === "object" && "error" in data
      && typeof data.error === "string" ? data.error.slice(0, 500) : "Spørgsmålet kunne ikke behandles.";
    throw Object.assign(new Error(serverMessage), { status: response.status });
  }
  if (!data || typeof data !== "object" || !("reply" in data)
    || typeof data.reply !== "string" || !data.reply.trim()) {
    throw new Error("Svaret fra Raymond var tomt.");
  }
  return data as RaymondChatResponse;
}
