/**
 * Build prompt for edit-requested variations from parent prompt + edit description + preserve aspects.
 */
export function buildEditPrompt(
  parentPrompt: string,
  editDescription: string,
  preserveAspects: string[]
): string {
  const preserve =
    preserveAspects.length > 0
      ? ` Keep these unchanged: ${preserveAspects.join(", ")}.`
      : "";
  return `${parentPrompt} Edit: ${editDescription}.${preserve}`.trim();
}

export function getEditVariants(
  basePrompt: string
): { conservative: string; moderate: string; bold: string } {
  return {
    conservative: `${basePrompt} Apply the edit subtly and minimally.`,
    moderate: basePrompt,
    bold: `${basePrompt} Apply the edit boldly and noticeably.`,
  };
}
