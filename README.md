# Shade & Tell: Color Palette & Contrast Checker

A lightweight web application built with HTML5, CSS3, and JavaScript that evaluates foreground and background color pairings against **ISO/IEC 40500 (WCAG 2.2)** contrast thresholds (`4.5:1` AA and `7.0:1` AAA) and exports `:root` CSS custom properties.

## Features
- Background and text hex color inputs with color pickers and swap toggle
- Interactive HSB color controls, RGB readout, saved swatches, and palette suggestions
- Real-time contrast ratio scoring (`12.4:1` default berry-and-cream pairing) with **WCAG AA / AAA** badges and live typography preview
- One-click **Copy CSS Variables** (`--bg-color`, `--text-color`)
- Interactive **5-step onboarding walkthrough**

## UI/UX Design & Storyboard Artifacts
- **High-Fidelity Wireframes:** [Shade & Tell - High-Fi Wireframes.png](design/Shade%20%26%20Tell%20-%20High-Fi%20Wireframes.png)
- **WCAG User Flow Storyboard:** [Shade & Tell - WCAG user flow storyboard.png](design/Shade%20%26%20Tell%20-%20WCAG%20user%20flow%20storyboard.png)
- **Tutorial Walkthrough Mockups:** [Shade & Tell - Tutorial Mockups.png](design/Shade%20%26%20Tell%20-%20Tutorial%20Mockups.png)

## Workflow
1. Designed wireframes, storyboard, and tutorial mockups in Figma (`design/`).
2. Developed and tested features on the `beta` branch before merging into `main`.

## QA Software Testing & Documentation
Comprehensive manual QA testing covering 23 test cases across 5 test scenarios (color normalization, HSB/RGB fine-tuning, WCAG 2.2 / ISO 40500 contrast validation, swatch management & dynamic suggestions, CSS export, and the 5-step walkthrough).

- 📊 **[QA Test Cases & Execution Log (Google Sheets)](https://docs.google.com/spreadsheets/d/1K4CxY89G8J_rL9SP2E7asMqWFJTeNlOBhJPrrrIsO_c/edit?usp=sharing)**
- 📂 **[QA Documentation Folder & Test Evidence (Google Drive)](https://drive.google.com/drive/folders/1QSQBLa6HS1Al6uuOBEzhwK0jhQMp97J_?usp=sharing)**
