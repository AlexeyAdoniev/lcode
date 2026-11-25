export interface ContestProblem {
  id: number;
  score: number;
}

export interface Contest {
  id: number;
  problems: ContestProblem[];
  startDate: Date;
  endDate: Date;
}
