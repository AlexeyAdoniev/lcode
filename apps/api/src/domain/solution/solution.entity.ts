export type Solution = {
  id: number;
  problemId: number;
  userId: number;
  passed: boolean;
  execMs: number;
  language: string;
  codeS3Url: string;
};

export type CreateSolutionResponse = {
  solution: Solution;
  s3PresignedUrl: string;
};
