import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { DebateEvent } from "@agora/shared";

export interface StreamedMessage {
  personaId: string;
  personaName: string;
  tokens: string;
  complete: boolean;
  messageId?: string;
  emotion?: string;
}

export interface DebateStreamState {
  streamedMessages: StreamedMessage[];
  currentPersonaId: string | null;
  currentRound: number | null;
  isStreaming: boolean;
  isComplete: boolean;
  waitingForAdvance: boolean;
}

const INITIAL_STATE: DebateStreamState = {
  streamedMessages: [],
  currentPersonaId: null,
  currentRound: null,
  isStreaming: false,
  isComplete: false,
  waitingForAdvance: false,
};

export function useDebateStream(debateId: string | undefined, enabled: boolean): DebateStreamState {
  const [state, setState] = useState<DebateStreamState>(INITIAL_STATE);
  const queryClient = useQueryClient();
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!enabled || !debateId) {
      setState(INITIAL_STATE);
      return;
    }

    const apiBase = import.meta.env.VITE_API_URL ?? "/api";
    const url = `${apiBase}/debates/${debateId}/stream`;
    const es = new EventSource(url);
    esRef.current = es;

    es.onmessage = (event: MessageEvent<string>) => {
      let debateEvent: DebateEvent;
      try {
        debateEvent = JSON.parse(event.data) as DebateEvent;
      } catch {
        return;
      }

      setState((prev) => applyEvent(prev, debateEvent));

      if (debateEvent.type === "debate_complete") {
        es.close();
        void queryClient.invalidateQueries({ queryKey: ["debates", "detail", debateId] });
        void queryClient.invalidateQueries({ queryKey: ["debates", "overview", debateId] });
      }
    };

    es.onerror = () => {
      es.close();
      setState((prev) => ({ ...prev, isStreaming: false }));
    };

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [debateId, enabled, queryClient]);

  return state;
}

function applyEvent(prev: DebateStreamState, event: DebateEvent): DebateStreamState {
  switch (event.type) {
    case "round_start":
      return {
        ...prev,
        currentRound: event.data.roundNumber,
        isStreaming: true,
        waitingForAdvance: false,
      };

    case "persona_start":
      return {
        ...prev,
        currentPersonaId: event.data.personaId,
        isStreaming: true,
        streamedMessages: [
          ...prev.streamedMessages,
          {
            personaId: event.data.personaId,
            personaName: event.data.personaName,
            tokens: "",
            complete: false,
          },
        ],
      };

    case "token": {
      const msgs = prev.streamedMessages.map((m) =>
        m.personaId === event.data.personaId && !m.complete
          ? { ...m, tokens: m.tokens + event.data.token }
          : m,
      );
      return { ...prev, streamedMessages: msgs };
    }

    case "persona_end": {
      const msgs = prev.streamedMessages.map((m) =>
        m.personaId === event.data.personaId && !m.complete
          ? { ...m, complete: true, messageId: event.data.messageId, emotion: event.data.emotion }
          : m,
      );
      return { ...prev, streamedMessages: msgs, currentPersonaId: null };
    }

    case "round_end":
      return { ...prev, waitingForAdvance: true };

    case "debate_complete":
      return {
        ...prev,
        isStreaming: false,
        isComplete: true,
        currentPersonaId: null,
        waitingForAdvance: false,
      };

    case "error":
      return { ...prev, isStreaming: false };

    default:
      return prev;
  }
}
