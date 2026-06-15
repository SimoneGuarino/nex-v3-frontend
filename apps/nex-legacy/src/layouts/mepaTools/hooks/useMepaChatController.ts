import { MutableRefObject, useCallback, useEffect, useRef, useState } from "react";
import {
  askMepaAi,
  getMepaChatMessages,
} from "../fetchData/mepaAi";
import {
  MepaChatMessage,
  MepaChatSuggestedAction,
  MepaDocumentChunkSearchResult,
  MepaRetrievalProvider,
  MepaVespaQueryStrategy,
} from "../types";

// Shared loading setter from the route container.
// The controller writes only stable loading tokens; it does not own global UI.
export type MepaChatLoadingSetter = (value: string | null) => void;

export interface UseMepaChatControllerParams {
  abortController: MutableRefObject<AbortController | null>;
  tenderId?: string | null;
  setLoading: MepaChatLoadingSetter;
}

/**
 * Owns the MEPA tender chat read model and request lifecycle.
 *
 * The page container should not keep chat-specific state directly: chat history,
 * RAG chunks, fallback metadata and suggested actions are a feature-domain concern.
 * This controller also guards against stale responses when the user changes tender
 * while a chat request is still in flight.
 */
export function useMepaChatController({
  abortController,
  tenderId,
  setLoading,
}: UseMepaChatControllerParams) {
  // Draft question currently typed or selected from a suggested prompt.
  const [chatQuestion, setChatQuestion] = useState(
    "Quali sono le criticità principali della gara?",
  );
  // Latest assistant answer shown in both Overview embedded chat and Chat tab.
  const [chatAnswer, setChatAnswer] = useState<string>(
    "Apri il workspace e chiedi all'assistente: userà il RAG documentale della pratica selezionata.",
  );
  // Conversation timeline returned by the backend.
  const [chatMessages, setChatMessages] = useState<MepaChatMessage[]>([]);
  // Follow-up actions proposed by the AI response.
  const [chatSuggestedActions, setChatSuggestedActions] = useState<
    MepaChatSuggestedAction[]
  >([]);
  // Explainability metadata returned by the AI agent. These fields are nullable
  // because older/partial responses may not include all diagnostics.
  const [chatConfidence, setChatConfidence] = useState<number | null>(null);
  const [chatIntent, setChatIntent] = useState<string | null>(null);
  const [chatLimitations, setChatLimitations] = useState<string[]>([]);
  // RAG evidence chunks used to answer the latest question.
  const [ragChunks, setRagChunks] = useState<MepaDocumentChunkSearchResult[]>(
    [],
  );
  // Retrieval diagnostics: provider, latency, mode and fallback state.
  const [retrievalProvider, setRetrievalProvider] = useState<
    MepaRetrievalProvider | undefined
  >(undefined);
  const [ragElapsedMs, setRagElapsedMs] = useState<number | null>(null);
  const [fallbackUsed, setFallbackUsed] = useState<boolean>(false);
  const [retrievalMode, setRetrievalMode] = useState<
    "LEXICAL" | "HYBRID_VECTOR" | undefined
  >(undefined);
  const [vespaQueryStrategy, setVespaQueryStrategy] = useState<
    MepaVespaQueryStrategy | undefined
  >(undefined);
  const [fallbackReason, setFallbackReason] = useState<string | null>(null);
  const [embeddingError, setEmbeddingError] = useState<string | null>(null);
  const [vespaHitsBeforeScope, setVespaHitsBeforeScope] = useState<number | null>(null);
  const [vespaScopedHits, setVespaScopedHits] = useState<number | null>(null);
  const [vespaSelfHealAttempted, setVespaSelfHealAttempted] = useState<boolean>(false);
  const [vespaSelfHealFed, setVespaSelfHealFed] = useState<number | null>(null);
  const [vespaSelfHealFailed, setVespaSelfHealFailed] = useState<number | null>(null);
  const [vespaSelfHealEmbeddingFailed, setVespaSelfHealEmbeddingFailed] = useState<number | null>(null);
  const [vespaSelfHealError, setVespaSelfHealError] = useState<string | null>(null);
  // Ref mirror used to ignore stale chat answers after switching tender.
  const activeTenderIdRef = useRef<string | null | undefined>(tenderId);

  useEffect(() => {
    activeTenderIdRef.current = tenderId;
  }, [tenderId]);

  /** Resets the chat read model when the selected tender changes. */
  const resetChatState = useCallback(() => {
    setChatAnswer(
      "Apri il workspace e chiedi all'assistente: userà il RAG documentale della pratica selezionata.",
    );
    setChatMessages([]);
    setChatSuggestedActions([]);
    setChatConfidence(null);
    setChatIntent(null);
    setChatLimitations([]);
    setRagChunks([]);
    setRetrievalProvider(undefined);
    setRagElapsedMs(null);
    setFallbackUsed(false);
    setRetrievalMode(undefined);
    setVespaQueryStrategy(undefined);
    setFallbackReason(null);
    setEmbeddingError(null);
    setVespaHitsBeforeScope(null);
    setVespaScopedHits(null);
    setVespaSelfHealAttempted(false);
    setVespaSelfHealFed(null);
    setVespaSelfHealFailed(null);
    setVespaSelfHealEmbeddingFailed(null);
    setVespaSelfHealError(null);
  }, []);

  useEffect(() => {
    resetChatState();
  }, [resetChatState, tenderId]);

  /**
   * Loads persisted chat history for the selected tender.
   *
   * A stale-response guard prevents a slow response from tender A updating the
   * UI after the user has already opened tender B.
   */
  const loadChatMessages = useCallback(async () => {
    if (!tenderId) return;
    const requestTenderId = tenderId;

    try {
      const res = await getMepaChatMessages({
        abortController,
        tenderId: requestTenderId,
        limit: 50,
      });

      if (activeTenderIdRef.current !== requestTenderId) return;

      const messages = res?.data?.messages ?? [];
      setChatMessages(messages);
      const lastAssistant = [...messages]
        .reverse()
        .find((msg) => msg.role === "assistant");

      if (lastAssistant?.content) {
        setChatAnswer(lastAssistant.content);
        const meta = lastAssistant.retrievalMeta ?? {};
        setRetrievalProvider(lastAssistant.retrievalProvider ?? undefined);
        setFallbackUsed(Boolean(meta.fallbackUsed));
        setFallbackReason(meta.fallbackReason ?? null);
        setRetrievalMode(meta.retrievalMode);
        setVespaQueryStrategy(meta.vespaQueryStrategy);
        setRagElapsedMs(typeof meta.elapsedMs === "number" ? meta.elapsedMs : null);
        setEmbeddingError(meta.embeddingError ?? null);
        setVespaHitsBeforeScope(typeof meta.vespaHitsBeforeScope === "number" ? meta.vespaHitsBeforeScope : null);
        setVespaScopedHits(typeof meta.vespaScopedHits === "number" ? meta.vespaScopedHits : null);
        setVespaSelfHealAttempted(Boolean(meta.vespaSelfHealAttempted));
        setVespaSelfHealFed(typeof meta.vespaSelfHealFed === "number" ? meta.vespaSelfHealFed : null);
        setVespaSelfHealFailed(typeof meta.vespaSelfHealFailed === "number" ? meta.vespaSelfHealFailed : null);
        setVespaSelfHealEmbeddingFailed(typeof meta.vespaSelfHealEmbeddingFailed === "number" ? meta.vespaSelfHealEmbeddingFailed : null);
        setVespaSelfHealError(meta.vespaSelfHealError ?? null);
        setChatConfidence(typeof meta.confidence === "number" ? meta.confidence : null);
        setChatIntent(typeof meta.intent === "string" ? meta.intent : null);
        setChatLimitations(Array.isArray(meta.limitations) ? meta.limitations : []);
        setRagChunks([]);
        setChatSuggestedActions(lastAssistant.suggestedActions ?? []);
      }
    } catch (error) {
      console.warn("MEPA chat history unavailable", error);
    }
  }, [abortController, tenderId]);

  /**
   * Sends the current question to the MEPA AI endpoint.
   *
   * The user message is appended optimistically to keep the UI responsive; when
   * the backend returns a canonical message, the timeline is reconciled.
   */
  const askAi = useCallback(async (questionOverride?: string) => {
    if (!tenderId) return;
    const normalizedQuestion = (questionOverride ?? chatQuestion).trim();
    if (!normalizedQuestion) return;
    const requestTenderId = tenderId;

    try {
      setLoading("chat");
      const userMessage: MepaChatMessage = {
        role: "user",
        content: normalizedQuestion,
        createdAt: new Date().toISOString(),
      };
      setChatMessages((current) => [...current, userMessage]);

      const res = await askMepaAi({
        abortController,
        tenderId: requestTenderId,
        question: normalizedQuestion,
        includeDossier: true,
        includeValidatedData: true,
      });

      if (activeTenderIdRef.current !== requestTenderId) return;

      const data = res?.data;
      setChatAnswer(
        data?.answer ?? data?.message?.content ?? "Risposta AI ricevuta.",
      );
      setRagChunks(data?.chunks ?? []);
      setRetrievalProvider(data?.retrievalProvider);
      setFallbackUsed(Boolean(data?.fallbackUsed));
      setRagElapsedMs(data?.elapsedMs ?? null);
      setRetrievalMode(data?.retrievalMode);
      setVespaQueryStrategy(data?.vespaQueryStrategy);
      setFallbackReason(data?.fallbackReason ?? null);
      setEmbeddingError(data?.embeddingError ?? null);
      setVespaHitsBeforeScope(typeof data?.vespaHitsBeforeScope === "number" ? data.vespaHitsBeforeScope : null);
      setVespaScopedHits(typeof data?.vespaScopedHits === "number" ? data.vespaScopedHits : null);
      setVespaSelfHealAttempted(Boolean(data?.vespaSelfHealAttempted));
      setVespaSelfHealFed(typeof data?.vespaSelfHealFed === "number" ? data.vespaSelfHealFed : null);
      setVespaSelfHealFailed(typeof data?.vespaSelfHealFailed === "number" ? data.vespaSelfHealFailed : null);
      setVespaSelfHealEmbeddingFailed(typeof data?.vespaSelfHealEmbeddingFailed === "number" ? data.vespaSelfHealEmbeddingFailed : null);
      setVespaSelfHealError(data?.vespaSelfHealError ?? null);
      setChatSuggestedActions(data?.suggestedActions ?? []);
      setChatConfidence(
        typeof data?.confidence === "number" ? data.confidence : null,
      );
      setChatIntent(data?.intent ?? null);
      setChatLimitations(data?.limitations ?? []);

      if (data?.message) {
        setChatMessages((current) => [
          ...current.filter((msg) => msg !== userMessage),
          userMessage,
          data.message,
        ]);
      } else {
        await loadChatMessages();
      }
    } catch (error) {
      console.error(error);
      setChatAnswer(
        "Non riesco a contattare il service-ai. Verifica capability, RAG e servizio AI.",
      );
    } finally {
      setLoading(null);
    }
  }, [
    abortController,
    chatQuestion,
    loadChatMessages,
    setLoading,
    tenderId,
  ]);

  return {
    chatQuestion,
    setChatQuestion,
    chatAnswer,
    chatMessages,
    chatSuggestedActions,
    chatConfidence,
    chatIntent,
    chatLimitations,
    ragChunks,
    retrievalProvider,
    ragElapsedMs,
    fallbackUsed,
    retrievalMode,
    vespaQueryStrategy,
    fallbackReason,
    embeddingError,
    vespaHitsBeforeScope,
    vespaScopedHits,
    vespaSelfHealAttempted,
    vespaSelfHealFed,
    vespaSelfHealFailed,
    vespaSelfHealEmbeddingFailed,
    vespaSelfHealError,
    resetChatState,
    loadChatMessages,
    askAi,
  };
}
