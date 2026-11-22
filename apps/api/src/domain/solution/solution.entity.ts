export type Solution = {
  id: number;
  problemId: number;
  userId: number;
  passed: boolean;
  execMs: number;
  language: string;
  codeS3Url: string;
};
