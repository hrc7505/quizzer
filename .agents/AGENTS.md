# Project Guidelines and Preferences

## 1. File Structure and Styles
- Use separate files for styles using Fluent UI's `makeStyles`. E.g., `use[ComponentName]Styles.ts` or `[ComponentName].styles.ts`.
- Place component interfaces in a separate file within a relevant `interfaces` folder. E.g., `components/ui/interfaces/[ComponentName].interface.ts`.

## 2. Reusability
- Prefer high reusability for UI components, utility code, and network requests (e.g., separating API calls into a service layer).

## 3. Documentation
- Use **JSDoc commenting** for all components, functions, interfaces, and complex logic blocks to ensure readability and maintainability.
