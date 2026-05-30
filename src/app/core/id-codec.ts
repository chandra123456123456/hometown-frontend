// Reversible obfuscation so raw DB ids never appear in a URL.
// Links carry encodeId(id); routes decode it back before any API call.
const KEY = 'htw-craft-7queen-key';

function toBase64Url(s: string): string {
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(s: string): string {
  const pad = s.length % 4 ? '='.repeat(4 - (s.length % 4)) : '';
  return atob(s.replace(/-/g, '+').replace(/_/g, '/') + pad);
}

function xor(s: string): string {
  let out = '';
  for (let i = 0; i < s.length; i++) {
    out += String.fromCharCode(s.charCodeAt(i) ^ KEY.charCodeAt(i % KEY.length));
  }
  return out;
}

export function encodeId(id: number): string {
  return toBase64Url(xor(String(id)));
}

export function decodeId(code: string): number {
  try {
    return Number(xor(fromBase64Url(code)));
  } catch {
    return NaN;
  }
}
