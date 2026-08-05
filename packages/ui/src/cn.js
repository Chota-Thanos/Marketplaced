/**
 * Minimal class joiner. Falsy entries drop out, so conditional classes read as
 * `cn('base', isActive && 'active')` without producing "base false".
 *
 * Deliberately not clsx/tailwind-merge: the primitives here put consumer
 * classes last, which is enough for override order, and the design system
 * should not drag runtime dependencies into every app that adopts it.
 */
export function cn(...parts) {
  return parts.flat(Infinity).filter(Boolean).join(' ');
}

export default cn;
