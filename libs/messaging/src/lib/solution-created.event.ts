export const SOLUTIONS_CREATE_TOPIC = 'solutions.create';

export type SolutionCreatedEvent = {
  solutionId: number;
};

export function serializeSolutionCreatedEvent(
  event: SolutionCreatedEvent,
): string {
  return JSON.stringify(event);
}

export function parseSolutionCreatedEvent(
  value: string | undefined,
): SolutionCreatedEvent {
  if (!value) {
    throw new Error('solutions.create message has no value');
  }

  const event: unknown = JSON.parse(value);
  if (!isSolutionCreatedEvent(event)) {
    throw new Error('solutions.create message has an invalid solutionId');
  }

  return event;
}

function isSolutionCreatedEvent(event: unknown): event is SolutionCreatedEvent {
  return (
    typeof event === 'object' &&
    event !== null &&
    'solutionId' in event &&
    typeof event.solutionId === 'number' &&
    Number.isInteger(event.solutionId) &&
    event.solutionId > 0
  );
}
