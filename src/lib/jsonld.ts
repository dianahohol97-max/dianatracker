/**
 * Serialize a value for embedding inside a <script type="application/ld+json">
 * tag. JSON.stringify alone is NOT safe here: it leaves `<`, `>` and `&`
 * untouched, so a user-controlled field containing `</script>` (e.g. a
 * photographer's display name or site copy) would break out of the tag and
 * inject markup — stored XSS. Escaping the HTML-significant characters and the
 * JS line terminators keeps the payload inert while staying valid JSON.
 */
export function jsonLdScript(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}
