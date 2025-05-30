// src/types/exam.ts
export type LangSpecificText = { [langKey: string]: string };
export type OptionValue = string | LangSpecificText; // Represents the actual value of an option

export interface Option { // This was defined before, ensure it aligns or is used if distinct from OptionValue
  id: string; // Unique ID for the option itself (e.g., 'opt_a')
  text: string | LangSpecificText; // The display text of the option
  value?: OptionValue; // Optional: if the stored value differs from display text or ID. Often, `id` or `text` itself is the value.
}

export interface Question {
  id: string; // Keep as string, consistent with Date.now().toString()
  type: 'multiple-choice' | 'open-ended';
  question: string | LangSpecificText; // Main question text

  // For multiple-choice questions
  // options?: Option[]; // Array of Option objects (more structured)
  // OR simpler OptionValue array if ids/complex structure not needed for options
  options?: OptionValue[]; // If options are just strings or LangSpecificText
  // OR if options are structured with IDs and text:
  // options?: { id: string; text: string | LangSpecificText }[];


  correctOptionId?: string; // ID of the correct Option (if using structured options with IDs)
  answerKey?: string | LangSpecificText; // For open-ended, or if correct MC answer is text-based
  explanation?: string | LangSpecificText;
}

export interface Exam {
  id: string;
  title: string;
  language?: {
    primary: string;
    secondary?: string;
  };
  questions: Question[];
  includeAnswerKey?: boolean; // Example of an additional exam-level property
}
