// src/lib/examSchema.ts
import { JSONSchemaType } from 'ajv';
import { Exam, Question, LangSpecificText, OptionValue } from '../types/exam';

// Helper for multilingual text schema (string or object with language keys)
const multilingualTextSchema: JSONSchemaType<string | LangSpecificText> = {
  oneOf: [
    { type: "string", minLength: 0 }, // Allow empty string for translations not yet filled
    {
      type: "object",
      additionalProperties: { type: "string" },
      minProperties: 1, // Must have at least one language if it's an object
      required: [] // No specific language codes are universally required beforehand
    }
  ]
};

// Helper for options schema
const questionOptionsSchema: JSONSchemaType<OptionValue[] | { [langKey: string]: string[] } | null> = {
  oneOf: [
    { // Array of OptionValue (string or LangSpecificText)
      type: "array",
      items: {
        oneOf: [
          { type: "string" },
          {
            type: "object",
            additionalProperties: { type: "string" },
            minProperties: 1,
            required: []
          }
        ]
      } as JSONSchemaType<OptionValue> // Added cast here
    },
    { // Object with language keys pointing to string arrays (as per example JSON)
      type: "object",
      additionalProperties: {
        type: "array",
        items: { type: "string" }
      },
      minProperties: 1,
      required: []
    },
    { type: "null" } // Explicitly allow null for options
  ]
};


export const examSchema: JSONSchemaType<Exam> = {
  type: "object",
  properties: {
    // ID is added by app, so schema should reflect its state in the JSON file (optional)
    id: { type: "string", nullable: true, minLength: 1 },
    title: { type: "string", minLength: 1 },
    language: {
      type: "object",
      nullable: true, // language object itself can be null/absent
      properties: {
        primary: { type: "string", minLength: 1 },
        secondary: { type: "string", nullable: true, minLength: 1 } // secondary can be null/absent
      },
      required: ["primary"]
    },
    includeAnswerKey: { type: "boolean", nullable: true }, // Can be null/absent
    questions: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        properties: {
          id: { oneOf: [{type: "string", minLength: 1}, {type: "number"}] },
          type: { enum: ["multiple-choice", "open-ended"] },
          domain: { type: "string", nullable: true, minLength: 1 }, // Added domain, can be null/absent or empty if not desired
          question: multilingualTextSchema,
          // Options are nullable and their schema already handles being null via oneOf
          options: questionOptionsSchema,
          answerKey: { // answerKey can be string, LangSpecificText, or null/absent
             oneOf: [
                { type: "string", minLength: 1 }, // minLength 1 if string answerKey
                {
                    type: "object",
                    additionalProperties: { type: "string" },
                    minProperties: 1,
                    required: []
                },
                { type: "null" } // Explicitly allow null
             ]
          }
        },
        required: ["id", "type", "question"],
        additionalProperties: true // Allow other fields like 'domain' if not explicitly listed, or future fields
      } as JSONSchemaType<Question>
    }
  },
  required: ["title", "questions"],
  additionalProperties: true
};
