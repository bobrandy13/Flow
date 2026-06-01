export interface TrueFalseQuestion {
  id: string;
  type: "true_false";
  question: string;
  answer: boolean;
  explanation: string;
}

export interface MultipleChoiceQuestion {
  id: string;
  type: "multiple_choice";
  question: string;
  options: string[];
  answer: string;
  explanation: string;
}

export type QuizQuestion = TrueFalseQuestion | MultipleChoiceQuestion;

export interface ChapterQuiz {
  chapter: string;
  slug: string;
  title: string;
  description: string;
  questions: QuizQuestion[];
}
