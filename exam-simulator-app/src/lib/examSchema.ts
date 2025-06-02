// src/lib/examSchema.ts
import { JSONSchemaType } from 'ajv';
import { Exam, Question, LangSpecificText, OptionValue } from '../types/exam';

const multilingualTextSchema: JSONSchemaType<string | LangSpecificText> = {
  oneOf: [
    { type: "string", minLength: 0 },
    {
      type: "object",
      patternProperties: { "^[a-z]{2,3}(-[A-Z]{2,3})?$": { type: "string" } },
      minProperties: 1,
      additionalProperties: false,
      required: []
    }
  ]
};

const optionValueSchema: JSONSchemaType<OptionValue> = {
  oneOf: [
    { type: "string", minLength: 1 },
    multilingualTextSchema
  ]
};

const optionsAsArraySchema: JSONSchemaType<OptionValue[]> = {
  type: "array",
  items: optionValueSchema,
  minItems: 1
};

const optionsAsLangMapSchema: JSONSchemaType<{ [langCode: string]: string[] }> = {
  type: "object",
  patternProperties: { "^[a-z]{2,3}(-[A-Z]{2,3})?$": { type: "array", items: { type: "string", minLength: 1 }, minItems: 1 } },
  minProperties: 1,
  additionalProperties: false
};

export const examSchema: JSONSchemaType<Exam> = {
  type: "object",
  properties: {
    id: { type: "string", nullable: true }, // ID is app-generated, so optional in file.
    title: { type: "string", minLength: 1 },
    language: {
      type: "object",
      nullable: true, // The entire 'language' object is optional.
      properties: {
        primary: { type: "string", minLength: 1 },
        secondary: { type: "string", nullable: true, minLength: 1 } // 'secondary' within language is optional.
      },
      required: ["primary"]
    },
    includeAnswerKey: { type: "boolean", nullable: true }, // Optional boolean.
    questions: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        properties: {
          id: { oneOf: [{type: "string", minLength: 1}, {type: "number"}] },
          type: { enum: ["multiple-choice", "open-ended"] },
          domain: { type: "string", nullable: true, minLength: 0 }, // Optional string, can be empty or null.
          question: multilingualTextSchema, // This schema itself does not include null.
          options: { // 'options' property can be one of several types or null.
            oneOf: [
              optionsAsArraySchema,
              optionsAsLangMapSchema,
              { type: "null" } // Explicitly allow null for the 'options' field
            ]
            // No `nullable: true` here as {type: "null"} is in oneOf
          },
          answerKey: { 
             oneOf: [
                { type: "string", minLength: 1 },
                multilingualTextSchema,
                { type: "null" } // Explicitly allow null for answerKey
             ]
             // No `nullable: true` here
          },
          explanation: {
            oneOf: [
                multilingualTextSchema,
                { type: "null" } // Explicitly allow null for explanation
            ]
            // No `nullable: true` here
          }
        },
        required: ["id", "type", "question"],
        additionalProperties: true 
      } as any // Using 'any' for items to simplify complex conditional schema for AJV TS integration
    }
  },
  required: ["title", "questions"],
  additionalProperties: true
};
