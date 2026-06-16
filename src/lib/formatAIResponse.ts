/**
 * Converts AI markdown-like output to clean prose.
 * Removes formatting symbols while preserving structure.
 */
export function formatAIResponse(text: string): string {
  return text
    // Remove bold: **text** or __text__ → text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/__(.*?)__/g, '$1')
    // Remove italic: *text* or _text_ → text
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/_(.*?)_/g, '$1')
    // Convert ## Header → just the header text (preserve line breaks)
    .replace(/^#{1,6}\s+(.+)$/gm, '$1')
    // Remove horizontal rules: --- or *** or ___
    .replace(/^[-*_]{3,}$/gm, '')
    // Remove bullet points: - item → item (keep the text, remove dash)
    .replace(/^[-*•]\s+/gm, '')
    // Remove numbered list formatting: 1. item → item
    .replace(/^\d+\.\s+/gm, '')
    // Collapse multiple blank lines into single blank line
    .replace(/\n{3,}/g, '\n\n')
    // Clean up leading/trailing whitespace
    .trim();
}

/**
 * Represents a section of a report-format response.
 */
export interface ReportSection {
  heading: string;
  body: string;
}

/**
 * Parses a report-format AI response into structured sections.
 * Expects plain text section headings followed by a colon (e.g., "Overview:")
 * and separated by line breaks.
 */
export function formatReportResponse(text: string): ReportSection[] {
  // First strip any remaining markdown symbols
  const cleanText = formatAIResponse(text);

  // Split by lines that end with a colon and start a new paragraph
  const lines = cleanText.split('\n');
  const sections: ReportSection[] = [];
  let currentHeading = '';
  let currentBody: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    // Detect a plain text heading (e.g., "Overview:", "Key Facts:")
    if (/^[A-Z][A-Za-z\s]+:$/.test(trimmed) && trimmed.length < 60) {
      // Save previous section
      if (currentHeading) {
        sections.push({
          heading: currentHeading,
          body: currentBody.join('\n').trim(),
        });
      }
      currentHeading = trimmed.replace(/:$/, '');
      currentBody = [];
    } else {
      currentBody.push(trimmed);
    }
  }

  // Push the last section
  if (currentHeading) {
    sections.push({
      heading: currentHeading,
      body: currentBody.join('\n').trim(),
    });
  }

  // If no sections were detected, return a single section with the full text
  if (sections.length === 0 && cleanText) {
    sections.push({ heading: '', body: cleanText });
  }

  return sections;
}
