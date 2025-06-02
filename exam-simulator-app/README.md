# Exam Simulator App

## Overview

The Exam Simulator App is a React Native application built with Expo that allows users to load and take exams from JSON files. It supports various question types, provides feedback, and allows for customization such as theme toggling.

## Features

*   **JSON Exam Upload:** Load exams from user-selected JSON files.
*   **Schema Validation:** Validates uploaded JSON exams against a defined schema to ensure correct structure.
*   **Multiple Question Types:** Supports "multiple-choice" and "open-ended" questions.
*   **Multilingual Support:** Questions and options can have text in multiple languages.
*   **Navigation:** Stack-based navigation between Upload, Exam List, Exam Execution, and Results screens.
*   **Exam Management:** List uploaded exams and delete unwanted ones.
*   **Exam Execution:** Step through questions, select/input answers.
*   **Results Display:** View exam results, including score (if answer key is provided) and time taken.
*   **Results Export:** Export exam results to JSON or CSV formats.
*   **Theming:** Light and Dark mode support with a theme toggle button. Preferences are saved to AsyncStorage.
*   **Styled Components:** UI styled using `styled-components`.
*   **TypeScript:** Codebase written in TypeScript for type safety.

## Prerequisites

*   **Node.js:** v18.x or later recommended.
*   **npm:** (Usually comes with Node.js) v9.x or later recommended.
*   **Expo CLI:** `npm install -g expo-cli` (if not already installed).

## Setup & Installation

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd exam-simulator-app
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```
    *   **Note:** If you encounter `ERESOLVE` errors related to peer dependencies (often with React, react-dom, and styled-components), try running:
        ```bash
        npm install --legacy-peer-deps
        ```

## Running the Application

You can run the application on different platforms using the following commands:

*   **Android:**
    ```bash
    npm run android
    # OR
    expo start --android
    ```

*   **iOS:**
    ```bash
    npm run ios
    # OR
    expo start --ios
    ```
    *(Requires macOS and Xcode, or use the Expo Go app on an iPhone/iPad)*

*   **Web:**
    ```bash
    npm run web
    # OR
    expo start --web
    ```

This will start the Metro bundler. You can then open the app in an emulator/simulator, on a physical device using the Expo Go app, or in a web browser.

## Exam File Format

Exams are loaded from JSON files. The application expects a specific structure for these files to be processed correctly.

*   **Schema:** For a detailed definition of the expected JSON structure, please refer to the schema file located at: `src/lib/examSchema.ts`.
*   **Key Properties:**
    *   `title` (string, required): The title of the exam.
    *   `questions` (array, required, min 1): An array of question objects.
    *   `language` (object, optional): Specifies primary and optional secondary languages (e.g., `{ "primary": "en", "secondary": "es" }`).
    *   `includeAnswerKey` (boolean, optional): If true, allows the app to score the exam and show correct answers.

*   **Example JSON Structure:**
    ```json
    {
      "title": "Multilingual Options Example Exam",
      "language": {
        "primary": "en",
        "secondary": "es"
      },
      "includeAnswerKey": true,
      "questions": [
        {
          "id": "q1_mcq_multilingual_options",
          "type": "multiple-choice",
          "question": {
            "en": "Which color is primary?",
            "es": "¿Qué color es primario?"
          },
          "options": [
            {
              "en": "Red",
              "es": "Rojo"
            },
            {
              "en": "Green",
              "es": "Verde"
            },
            {
              "en": "Purple",
              "es": "Morado"
            }
          ],
          "answerKey": { 
            "en": "Red",
            "es": "Rojo"
          },
          "explanation": {
            "en": "Red is a primary color.",
            "es": "El rojo es un color primario."
          }
        },
        {
          "id": "q2_open_ended",
          "type": "open-ended",
          "question": {
            "en": "Describe the sky.",
            "es": "Describe el cielo."
          }
        }
      ]
    }
    ```
    *   **Note on Multilingual Options:** For multiple-choice questions where each option itself needs to be multilingual (to provide subtitles or alternate language versions for each choice), the `options` field should be an array of objects. Each object in this array represents a single choice and should map language codes (e.g., "en", "es") to the translated text for that specific option. For instance:
        ```json
        "options": [
          { "en": "Option A (English)", "es": "Opción A (Español)" },
          { "en": "Option B (English)", "es": "Opción B (Español)" }
        ]
        ```
        The schema also supports a simpler format for multilingual options where the `options` field is an object mapping language codes to arrays of strings (e.g., `"options": { "en": ["Opt1", "Opt2"], "es": ["Opción1", "Opción2"] }`). This format is suitable if individual options don't need their own distinct translations for a secondary display but rather the entire list of options changes per language.

## Project Structure

A brief overview of the key directories:

*   `src/screens`: Contains components for different application screens (e.g., `UploadScreen.tsx`, `ExamListScreen.tsx`).
*   `src/components`: Intended for reusable UI components (currently minimal).
*   `src/navigation`: Houses the navigation setup, primarily `AppNavigator.tsx`.
*   `src/context`: For React Context API implementations, like `ThemeContext.tsx`.
*   `src/theme`: Defines the light and dark theme objects (`theme.ts`).
*   `src/types`: Contains TypeScript type definitions, especially `exam.ts` for exam-related interfaces.
*   `src/lib`: For utility libraries, data schemas, etc. Includes `examSchema.ts` for JSON validation.
*   `assets`: Static assets like icons and fonts.

## Available Scripts

In the project directory, you can run the following scripts:

*   `npm start`: Starts the Metro bundler (same as `expo start`).
*   `npm run android`: Builds and runs the app on an Android emulator or connected device.
*   `npm run ios`: Builds and runs the app on an iOS simulator or connected device.
*   `npm run web`: Runs the app in a web browser.
*   `npm run eject`: (Use with caution) Ejects the project from Expo managed workflow to bare workflow.

---
*This README provides a general guide to the Exam Simulator App.*
