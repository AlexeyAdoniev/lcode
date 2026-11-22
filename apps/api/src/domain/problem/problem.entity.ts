export type ProblemValue = string | number;

export interface ProblemTest {
  inputs: ProblemValue[];
  output: ProblemValue;
}

export type Problem = {
  id: number;
  name: string;
  description: string;
  tests: ProblemTest[];
};
