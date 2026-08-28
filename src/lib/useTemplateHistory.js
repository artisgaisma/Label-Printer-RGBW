import { useCallback, useRef, useState } from 'react';

const maxHistory = 50;
const coalesceMs = 500;

export function useTemplateHistory(createInitial) {
  const [template, setTemplateState] = useState(createInitial);
  const templateRef = useRef(template);
  templateRef.current = template;

  const pastRef = useRef([]);
  const futureRef = useRef([]);
  const gestureActiveRef = useRef(false);
  const lastRecordAtRef = useRef(0);
  const [historyVersion, setHistoryVersion] = useState(0);

  const notifyHistory = useCallback(() => {
    setHistoryVersion((version) => version + 1);
  }, []);

  const beginGesture = useCallback(() => {
    if (gestureActiveRef.current) {
      return;
    }

    gestureActiveRef.current = true;
    pastRef.current = [...pastRef.current, cloneTemplate(templateRef.current)].slice(-maxHistory);
    futureRef.current = [];
    lastRecordAtRef.current = Date.now();
    notifyHistory();
  }, [notifyHistory]);

  const endGesture = useCallback(() => {
    if (!gestureActiveRef.current) {
      return;
    }

    gestureActiveRef.current = false;

    const last = pastRef.current[pastRef.current.length - 1];
    if (last && templatesEqual(last, templateRef.current)) {
      pastRef.current = pastRef.current.slice(0, -1);
      notifyHistory();
    }
  }, [notifyHistory]);

  const setTemplate = useCallback(
    (updater, options = {}) => {
      const { history = 'auto' } = options;

      setTemplateState((current) => {
        const next = typeof updater === 'function' ? updater(current) : updater;
        if (next === current || templatesEqual(current, next)) {
          return current;
        }

        if (history === 'reset') {
          pastRef.current = [];
          futureRef.current = [];
          gestureActiveRef.current = false;
          lastRecordAtRef.current = 0;
          queueMicrotask(notifyHistory);
          return next;
        }

        if (history === 'skip' || (history === 'auto' && gestureActiveRef.current)) {
          return next;
        }

        const now = Date.now();
        const shouldCoalesce = history === 'auto' && now - lastRecordAtRef.current < coalesceMs;

        if (!shouldCoalesce) {
          pastRef.current = [...pastRef.current, cloneTemplate(current)].slice(-maxHistory);
          futureRef.current = [];
          queueMicrotask(notifyHistory);
        }

        lastRecordAtRef.current = now;
        return next;
      });
    },
    [notifyHistory],
  );

  const undo = useCallback(() => {
    if (!pastRef.current.length) {
      return;
    }

    gestureActiveRef.current = false;
    const previous = pastRef.current[pastRef.current.length - 1];
    pastRef.current = pastRef.current.slice(0, -1);
    futureRef.current = [...futureRef.current, cloneTemplate(templateRef.current)].slice(-maxHistory);
    lastRecordAtRef.current = 0;
    setTemplateState(previous);
    notifyHistory();
  }, [notifyHistory]);

  const redo = useCallback(() => {
    if (!futureRef.current.length) {
      return;
    }

    gestureActiveRef.current = false;
    const next = futureRef.current[futureRef.current.length - 1];
    futureRef.current = futureRef.current.slice(0, -1);
    pastRef.current = [...pastRef.current, cloneTemplate(templateRef.current)].slice(-maxHistory);
    lastRecordAtRef.current = 0;
    setTemplateState(next);
    notifyHistory();
  }, [notifyHistory]);

  return {
    template,
    setTemplate,
    undo,
    redo,
    beginGesture,
    endGesture,
    canUndo: pastRef.current.length > 0,
    canRedo: futureRef.current.length > 0,
    historyVersion,
  };
}

function cloneTemplate(template) {
  return structuredClone(template);
}

function templatesEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}
