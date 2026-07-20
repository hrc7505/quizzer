/**
 * Collapse multi-line named imports into a single line when they fit
 * within `maxLineLength` (default 120).
 *
 * Example:
 *   import {
 *     Brain,
 *     BookOpen,
 *   } from "lucide-react";
 * becomes:
 *   import { Brain, BookOpen } from "lucide-react";
 */
"use strict";

const MAX_LINE_LENGTH = 120;

function specifierName(specifier) {
  if (specifier.type === "ImportSpecifier") {
    const imported = specifier.imported.name;
    const local = specifier.local.name;
    return imported === local ? imported : `${imported} as ${local}`;
  }
  if (specifier.type === "ImportDefaultSpecifier") return specifier.local.name;
  if (specifier.type === "ImportNamespaceSpecifier") return `* as ${specifier.local.name}`;
  return specifier.local.name;
}

function isMultilineNamedImport(node) {
  if (node.type !== "ImportDeclaration") return false;
  if (!node.specifiers.length) return false;
  if (node.source.type !== "Literal") return false;

  const first = node.specifiers[0];
  const last = node.specifiers[node.specifiers.length - 1];
  if (first.loc.start.line === last.loc.start.line) return false;

  const hasNamed = node.specifiers.some((s) => s.type === "ImportSpecifier");
  return hasNamed;
}

function buildCollapsedImport(node) {
  const names = node.specifiers.map(specifierName);
  const source = node.source.value;
  const text = `import { ${names.join(", ")} } from "${source}";`;
  return text;
}

module.exports = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Collapse multi-line imports into a single line when short enough",
      category: "Stylistic Issues",
      recommended: false,
    },
    fixable: "code",
    schema: [
      {
        type: "object",
        properties: {
          maxLineLength: {
            type: "number",
            default: MAX_LINE_LENGTH,
          },
        },
        additionalProperties: false,
      },
    ],
  },
  create(context) {
    const sourceCode = context.sourceCode;
    const options = context.options[0] || {};
    const maxLen = options.maxLineLength ?? MAX_LINE_LENGTH;

    return {
      ImportDeclaration(node) {
        if (!isMultilineNamedImport(node)) return;

        const importText = buildCollapsedImport(node);
        if (importText.length > maxLen) return;

        // Skip if there are inline comments inside the import braces
        const openBrace = node.specifiers[0].loc.start.line === node.loc.start.line
          ? null
          : sourceCode.text.indexOf("{", node.loc.start.column);
        // Simpler: just check tokens between first and last specifier for comments
        const comments = sourceCode.getCommentsInside(node);
        const hasInlineComment = comments.some(
          (c) =>
            c.loc.start.line > node.specifiers[0].loc.start.line &&
            c.loc.end.line < node.specifiers[node.specifiers.length - 1].loc.end.line
        );
        if (hasInlineComment) return;

        context.report({
          node,
          message: "Collapse this multi-line import into a single line",
          fix(fixer) {
            return fixer.replaceText(node, importText);
          },
        });
      },
    };
  },
};
