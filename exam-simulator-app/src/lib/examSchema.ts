// src/lib/examSchema.ts
import { JSONSchemaType } from 'ajv';
import { Exam, Question, LangSpecificText, OptionValue } from '../types/exam';

const multilingualTextSchema = {
  oneOf: [
    { type: "string" },
    {
      type: "object",
      additionalProperties: { type: "string" },
      minProperties: 1,
    }
  ]
};

const questionOptionsSchema = {
  oneOf: [
    {
      type: "array",
      items: {
        oneOf: [
          { type: "string" },
          {
            type: "object",
            additionalProperties: { type: "string" },
            minProperties: 1,
          }
        ]
      },
      // minItems: 1 // A multiple choice question should have at least one option. Applied in custom validation.
    },
    {
      type: "object", // For multilingual options like { "en": ["Option 1"], "es": ["Opción 1"] }
      additionalProperties: {
        type: "array",
        items: { type: "string" }
        // minItems: 1 // Each language array should also have options. Applied in custom validation.
      },
      minProperties: 1, // At least one language must be provided.
    }
  ]
};

export const examSchema: JSONSchemaType<Exam> = {
  type: "object",
  properties: {
    id: { type: "string", nullable: true }, // ID is assigned by app, so nullable for uploaded file
    title: { type: "string", minLength: 1 },
    language: {
      type: "object",
      nullable: true,
      properties: {
        primary: { type: "string", minLength: 1 },
        secondary: { type: "string", minLength: 1, nullable: true }
      },
      required: ["primary"]
    },
    includeAnswerKey: { type: "boolean", nullable: true },
    questions: {
      type: "array",
      minItems: 1, // An exam must have at least one question
      items: {
        type: "object",
        properties: {
          id: { oneOf: [{type: "string", minLength: 1}, {type: "number"}] }, // Allow string or number for question ID
          type: { enum: ["multiple-choice", "open-ended"] },
          question: multilingualTextSchema,
          options: {
            ...questionOptionsSchema,
            nullable: true // Options are only required for 'multiple-choice' type, handled by custom validation logic
          },
          answerKey: { // answerKey can be string or multilingual object
             oneOf: [
                { type: "string" },
                {
                    type: "object",
                    additionalProperties: { type: "string" },
                    minProperties: 1,
                }
             ],
             nullable: true
          },
          // 'explanation' field is not explicitly defined in the schema here,
          // but `additionalProperties: true` on the main schema allows it.
          // If explanation needs specific validation, it should be added.
          // For now, relying on the `Question` type in `../types/exam` which has `explanation?: string | LangSpecificText;`
        },
        required: ["id", "type", "question"],
        // Cast to any because Question type has explanation? which is not in properties here.
        // AJV will validate against defined properties and allow others if additionalProperties is not false.
      } as any
    }
  },
  required: ["title", "questions"],
  additionalProperties: true // Allow other properties like 'explanation' at question level, or other top-level exam properties
};
