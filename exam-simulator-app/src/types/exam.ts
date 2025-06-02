// src/types/exam.ts

// Defines a structure for text that can be a simple string or an object
// where keys are language codes (e.g., "en", "es") and values are strings.
export type LangSpecificText = { 
  [langCode: string]: string; 
};

// Defines the value of a selectable option or an answer key.
// It can be a simple string or a LangSpecificText object for multilingual values.
export type OptionValue = string | LangSpecificText;

// Interface for a single question within an exam.
export interface Question {
  id: string | number; // Unique identifier for the question (can be string or number from JSON).
  type: 'multiple-choice' | 'open-ended'; // Type of the question.
  domain?: string | null; // Optional domain/category for the question. Can be null or undefined.
  question: string | LangSpecificText; // The question text itself, can be multilingual.

  // Options for multiple-choice questions. Can be:
  // 1. An array of OptionValue (each option is string or LangSpecificText).
  // 2. An object where keys are language codes and values are arrays of simple strings.
  // 3. Null or undefined (especially for open-ended questions).
  options?: OptionValue[] | { [langCode: string]: string[] } | null;
  
  // The correct answer for the question. Can be string, LangSpecificText, null, or undefined.
  answerKey?: OptionValue | null; 
  
  // Optional explanation for the question's answer, can be multilingual.
  explanation?: string | LangSpecificText | null;

  // Allows for other properties that might be dynamically added (e.g., userProvidedAnswer for exports).
  [key: string]: any; 
}

// Interface for the main Exam structure.
export interface Exam {
  id: string; // App-generated unique ID for the exam instance
  userId: string; // ID of the user who uploaded/owns this exam
  title: string;
  isPublic: boolean; // True if the exam is public, false if private to the user
  language?: {
    primary: string;
    secondary?: string;
  } | null;
  includeAnswerKey?: boolean | null;
  questions: Question[];
  // Allow any other top-level properties for future extensions or custom tags from original JSON
  [key: string]: any; 
}
