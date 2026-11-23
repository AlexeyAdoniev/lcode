export const SOLUTIONS_READY_TOPIC = 'solutions.ready';

export type SolutionReadyEvent = {
  solutionId: number;
};

export function serializeSolutionReadyEvent(event: SolutionReadyEvent): string {
  return JSON.stringify(event);
}

export function parseSolutionReadyEvent(
  value: string | undefined,
): SolutionReadyEvent {
  if (!value) {
    throw new Error('solutions.ready message has no value');
  }

  const event: unknown = JSON.parse(value);
  if (!isSolutionReadyEvent(event)) {
    throw new Error('solutions.ready message has an invalid solutionId');
  }

  return event;
}

function isSolutionReadyEvent(event: unknown): event is SolutionReadyEvent {
  return (
    typeof event === 'object' &&
    event !== null &&
    'solutionId' in event &&
    typeof event.solutionId === 'number' &&
    Number.isInteger(event.solutionId) &&
    event.solutionId > 0
  );
}
