import { useContext, useEffect, useId, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Link, useLocation } from "react-router-dom";
import remarkGfm from "remark-gfm";
import { beginLogin, getUserProfile, isLoggedIn } from "../../auth";
import {
  raymondChatErrorMessage,
  sendRaymondChat,
  type RaymondChatRequest,
  type RaymondChatResponse,
  type RaymondChatSource,
} from "../../lib/raymondChat";
import { RaymondContext, type RaymondWorkContext } from "./RaymondContext";
import { RaymondAvatar } from "./RaymondUI";
import "./chat.css";

type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
  delivery?: "pending" | "answered" | "failed";
  sources?: RaymondChatSource[];
};

type RequestAttempt = {
  controller: AbortController;
  request: RaymondChatRequest;
  userMessageId: string;
};

type FailedRequest = {
  request: RaymondChatRequest;
  userMessageId: string;
  message: string;
  needsLogin: boolean;
  cancelled: boolean;
};

function LoginPrompt() {
  return (
    <div className="raymond-chat-login">
      <RaymondAvatar mood="help" size={128} />
      <h3>Hvad vil du gerne forstå?</h3>
      <p>Spørg Raymond om SQL, en opgave eller en fejl, du arbejder med.</p>
      <button type="button" className="btn primary" onClick={() => beginLogin()}>
        Log ind for at spørge Raymond
      </button>
      <p className="raymond-chat-muted">
        Guiden og SQL-hjælpen i de andre faner er åbne uden login.
      </p>
    </div>
  );
}

/** Identity-keyed memory: no transcript or draft is stored in browser storage. */
export function RaymondChat({ active }: { active: boolean }) {
  const context = useContext(RaymondContext);
  const { pathname } = useLocation();
  const userSub = isLoggedIn() ? getUserProfile()?.sub : null;
  if (!userSub) return <LoginPrompt />;
  return (
    <StudentChat
      key={userSub}
      owner={userSub}
      active={active}
      pathname={pathname}
      workContext={context?.workContext ?? null}
    />
  );
}

function StudentChat({ owner, active, pathname, workContext }: {
  owner: string;
  active: boolean;
  pathname: string;
  workContext: RaymondWorkContext | null;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [includeWork, setIncludeWork] = useState(true);
  const [sending, setSending] = useState(false);
  const [failure, setFailure] = useState<FailedRequest | null>(null);
  const [lastContext, setLastContext] = useState<{
    contentSlug?: string;
    path: string;
    context: RaymondChatResponse["context"];
  } | null>(null);
  const flightRef = useRef<RequestAttempt | null>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const followBottomRef = useRef(true);
  const questionId = useId();
  const workId = useId();
  const privacyId = useId();
  const currentSub = isLoggedIn() ? getUserProfile()?.sub : null;

  useEffect(() => () => {
    const attempt = flightRef.current;
    flightRef.current = null;
    attempt?.controller.abort();
  }, []);

  // A closed panel or another tab never keeps an unnoticed request running.
  useEffect(() => {
    if (!active || currentSub !== owner) flightRef.current?.controller.abort();
  }, [active, currentSub, owner]);

  useEffect(() => {
    const transcript = transcriptRef.current;
    if (active && transcript && followBottomRef.current) {
      transcript.scrollTop = transcript.scrollHeight;
    }
  }, [active, messages, sending, failure]);

  async function runRequest(request: RaymondChatRequest, userMessageId: string) {
    if (flightRef.current || getUserProfile()?.sub !== owner) return;
    const attempt = { controller: new AbortController(), request, userMessageId };
    flightRef.current = attempt;
    setSending(true);
    setFailure(null);
    setMessages((previous) => previous.map((message): Message => message.id === userMessageId
      ? { ...message, delivery: "pending" } : message));
    try {
      const response = await sendRaymondChat(request, AbortSignal.any([
        attempt.controller.signal,
        AbortSignal.timeout(90_000),
      ]));
      if (flightRef.current !== attempt || getUserProfile()?.sub !== owner) return;
      setMessages((previous) => [
        ...previous.map((message): Message => message.id === userMessageId
          ? { ...message, delivery: "answered" } : message),
        {
          id: crypto.randomUUID(), role: "assistant", text: response.reply,
          sources: Array.isArray(response.sources) ? response.sources : [],
        },
      ]);
      setLastContext({ contentSlug: request.contentSlug, path: request.path, context: response.context });
    } catch (error) {
      if (flightRef.current !== attempt || getUserProfile()?.sub !== owner) return;
      const cancelled = attempt.controller.signal.aborted;
      setMessages((previous) => previous.map((message): Message => message.id === userMessageId
        ? { ...message, delivery: "failed" } : message));
      setFailure({
        request, userMessageId, cancelled,
        needsLogin: (error as { status?: number } | undefined)?.status === 401,
        message: cancelled
          ? "Svaret blev afbrudt. Du kan prøve igen med det samme spørgsmål."
          : raymondChatErrorMessage(error),
      });
    } finally {
      if (flightRef.current === attempt) {
        flightRef.current = null;
        setSending(false);
      }
    }
  }

  function sendQuestion() {
    const text = draft.trim();
    if (!text || flightRef.current || getUserProfile()?.sub !== owner) return;
    const request: RaymondChatRequest = {
      message: text,
      history: messages
        .filter((message) => message.role === "assistant" || message.delivery === "answered")
        .slice(-12)
        .map(({ role, text: previousText }) => ({ role, text: previousText.slice(0, 4000) })),
      path: pathname,
      includeWork,
      contentSlug: workContext?.contentSlug,
      ...(includeWork ? {
        currentSql: workContext?.currentSql?.slice(0, 12000),
        lastError: workContext?.lastError?.slice(0, 3000),
        resultSummary: workContext?.resultSummary?.slice(0, 1200),
        checkMessages: workContext?.checkMessages?.slice(0, 8).map((message) => message.slice(0, 600)),
        checkPassed: workContext?.checkPassed,
      } : {}),
    };
    const userMessageId = crypto.randomUUID();
    followBottomRef.current = true;
    setMessages((previous) => [...previous, { id: userMessageId, role: "user", text, delivery: "pending" }]);
    setDraft("");
    textareaRef.current?.focus({ preventScroll: true });
    void runRequest(request, userMessageId);
  }

  function resetChat() {
    const attempt = flightRef.current;
    flightRef.current = null;
    attempt?.controller.abort();
    setMessages([]);
    setDraft("");
    setSending(false);
    setFailure(null);
    setLastContext(null);
    followBottomRef.current = true;
    textareaRef.current?.focus({ preventScroll: true });
  }

  if (currentSub !== owner) return <LoginPrompt />;

  const matchingContext = lastContext?.path === pathname
    && lastContext?.contentSlug === workContext?.contentSlug ? lastContext.context : null;
  const lessonLabel = matchingContext?.lessonTitle || workContext?.contentSlug
    || (pathname === "/playground" ? "Playground" : "Den aktuelle side");

  return (
    <section className="raymond-chat" aria-label="Samtale med Raymond">
      <div className="raymond-chat-toolbar">
        <span className="raymond-chat-context" title={lessonLabel}>{lessonLabel}</span>
        <button type="button" className="raymond-chat-reset" onClick={resetChat} disabled={!messages.length && !draft}>
          Ny samtale
        </button>
      </div>

      <div
        className="raymond-chat-transcript"
        ref={transcriptRef}
        role="log"
        aria-label="Beskeder i samtalen"
        aria-live={active ? "polite" : "off"}
        aria-relevant="additions"
        tabIndex={0}
        onScroll={() => {
          const element = transcriptRef.current;
          if (element) followBottomRef.current = element.scrollHeight - element.scrollTop - element.clientHeight < 80;
        }}
      >
        {!messages.length && (
          <div className="raymond-chat-empty">
            <RaymondAvatar mood="help" size={120} />
            <h3>Lad os undersøge det sammen</h3>
            <p>Hvad prøver du at finde ud af? Fortæl gerne, hvad du allerede har forsøgt.</p>
            <button type="button" onClick={() => {
              setDraft("Giv mig et hint til, hvordan jeg kommer videre med min opgave, uden at give mig hele løsningen.");
              textareaRef.current?.focus({ preventScroll: true });
            }}>Hjælp mig videre med opgaven</button>
          </div>
        )}
        {messages.map((message) => (
          <article className={`raymond-chat-message raymond-chat-message--${message.role}`} key={message.id}>
            <p className="raymond-chat-speaker">{message.role === "user" ? "Dig" : "Raymond"}</p>
            {message.role === "user" ? <p className="raymond-chat-question">{message.text}</p> : (
              <div className="raymond-chat-markdown">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  disallowedElements={["img"]}
                  components={{
                    a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>,
                  }}
                >{message.text}</ReactMarkdown>
              </div>
            )}
            {!!message.sources?.length && (
              <div className="raymond-chat-sources">
                <span>Læs videre i pensum</span>
                <ul>{message.sources.map((source) => (
                  <li key={source.slug}>
                    <Link to={`/learn/${encodeURIComponent(source.slug)}`} target="_blank" rel="noopener noreferrer" aria-label={`${source.title} (åbner ny fane)`}>
                      {source.title} <span aria-hidden="true">↗</span>
                    </Link>
                  </li>
                ))}</ul>
              </div>
            )}
          </article>
        ))}
        {sending && (
          <div className="raymond-chat-pending" role="status">
            <RaymondAvatar mood="thinking" size={62} />
            <span>Raymond tænker<span className="raymond-chat-dots" aria-hidden="true">…</span></span>
            <button type="button" onClick={() => {
              flightRef.current?.controller.abort();
              textareaRef.current?.focus({ preventScroll: true });
            }}>Afbryd</button>
          </div>
        )}
        {failure && (
          <div className={`raymond-chat-failure${failure.cancelled ? " is-cancelled" : ""}`} role={failure.cancelled ? "status" : "alert"}>
            <p>{failure.message}</p>
            {failure.needsLogin ? (
              <button type="button" className="btn" onClick={() => beginLogin()}>Log ind igen</button>
            ) : (
              <>
                <p className="raymond-chat-retry-context">
                  Et genforsøg bruger samme spørgsmål og {failure.request.includeWork
                    ? "SQL-arbejdet fra den oprindelige afsendelse"
                    : "samme kontekst uden aktuelt SQL-arbejde"}.
                </p>
                <button type="button" className="btn" onClick={() => {
                  followBottomRef.current = true;
                  textareaRef.current?.focus({ preventScroll: true });
                  void runRequest(failure.request, failure.userMessageId);
                }}>Prøv igen</button>
              </>
            )}
          </div>
        )}
      </div>

      <form className="raymond-chat-compose" onSubmit={(event) => { event.preventDefault(); sendQuestion(); }}>
        <label className="raymond-chat-work" htmlFor={workId}>
          <input id={workId} type="checkbox" checked={includeWork} onChange={(event) => setIncludeWork(event.target.checked)} />
          <span>Medtag mit aktuelle SQL-arbejde</span>
        </label>
        <p className="raymond-chat-work-description">
          {includeWork
            ? "Din SQL, resultatoversigt, seneste fejl, opgavetjek og seneste kørsler kan indgå."
            : "Aktuelt SQL-arbejde udelades. Tidligere beskeder i samtalen og den aktuelle lektion kan stadig indgå."}
        </p>
        <label htmlFor={questionId} className="raymond-chat-input-label">Dit spørgsmål</label>
        <textarea
          id={questionId}
          ref={textareaRef}
          rows={3}
          maxLength={4000}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.ctrlKey || event.metaKey) && !event.nativeEvent.isComposing) {
              event.preventDefault();
              sendQuestion();
            }
          }}
          aria-describedby={privacyId}
          placeholder="Fx: Hvorfor giver min JOIN flere rækker end forventet?"
        />
        <div className="raymond-chat-send-row">
          <span>Ctrl+Enter sender</span>
          <button type="submit" className="btn primary" disabled={sending || !draft.trim()}>Send spørgsmål</button>
        </div>
        <p id={privacyId} className="raymond-chat-privacy">
          Dit spørgsmål og den valgte kontekst sendes til OpenAI. AI kan tage fejl.
        </p>
        {matchingContext && (
          <p className="raymond-chat-used-context">
            Seneste svar: {matchingContext.includesWork ? "med SQL-arbejde" : "uden SQL-arbejde"}
            {matchingContext.includesWork && matchingContext.recentQueries > 0
              ? ` · ${matchingContext.recentQueries} seneste kørsler` : ""}.
          </p>
        )}
      </form>
    </section>
  );
}
