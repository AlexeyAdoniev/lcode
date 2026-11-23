export const SOLUTION_STATUS = {
  PENDING_UPLOAD: 'pending_upload',
  READY: 'ready',
} as const;

export type SolutionStatus =
  (typeof SOLUTION_STATUS)[keyof typeof SOLUTION_STATUS];

export type Solution = {
  id: number;
  problemId: number;
  userId: number;
  passed: boolean;
  execMs: number;
  language: string;
  codeS3Url: string;
  status: SolutionStatus;
};

export type CreateSolutionResponse = {
  solution: Solution;
  s3PresignedUrl: string;
};
