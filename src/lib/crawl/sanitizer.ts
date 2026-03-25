const MAX_LENGTH = 50000;

export function sanitizeContent(content: string): string {
  let sanitized = content
    // Remove remaining HTML tags
    .replace(/<[^>]*>/g, "")
    // Normalize whitespace
    .replace(/[ \t]+/g, " ")
    // Normalize newlines
    .replace(/\n{3,}/g, "\n\n")
    // Trim each line
    .split("\n")
    .map((line) => line.trim())
    .join("\n")
    .trim();

  // Truncate to max length
  if (sanitized.length > MAX_LENGTH) {
    sanitized = sanitized.substring(0, MAX_LENGTH) + "\n\n[내용이 잘렸습니다...]";
  }

  return sanitized;
}

export function countWords(text: string): number {
  // Count Korean characters + English words
  const koreanChars = (text.match(/[\uAC00-\uD7AF]/g) || []).length;
  const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
  return koreanChars + englishWords;
}
