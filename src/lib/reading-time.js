const BANGLA_WORD = /[\u0980-\u09FF]+/g;
const ARABIC_WORD = /[\u0600-\u06FF]+/g;
const LATIN_WORD = /[A-Za-z0-9]+(?:['’][A-Za-z0-9]+)*/g;
const WPM = 200;

export function stripMarkup(text = '') {
  return String(text)
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#>*_~|]/g, ' ');
}

export function countReadableWords(text = '') {
  const stripped = stripMarkup(text);
  const latin = stripped.match(LATIN_WORD)?.length ?? 0;
  const bangla = stripped.match(BANGLA_WORD)?.length ?? 0;
  const arabic = stripped.match(ARABIC_WORD)?.length ?? 0;
  return latin + bangla + arabic;
}

export function readingMinutes(text = '', wpm = WPM) {
  const words = countReadableWords(text);
  return Math.max(1, Math.round(words / wpm) || 1);
}

export function readingLabel(text = '') {
  return `${readingMinutes(text)} min read`;
}
