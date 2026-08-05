/**
 * packages/ui — brand-neutral primitives.
 *
 * Every component here reads from packages/tokens and nothing else: no hex
 * literals, no default-palette Tailwind utilities (bg-gray-100, text-slate-600
 * and friends), no brand strings. That constraint is what lets a second app
 * import these unchanged, and it is enforced by the eslint rules in
 * eslint.config.mjs rather than by convention.
 */

export { cn } from './src/cn';
export { Button } from './src/Button';
export { Field, Input, Textarea, Select, Checkbox } from './src/Field';
export { Modal, Drawer } from './src/Modal';
export { Card, Panel, Badge, Alert, Skeleton, Spinner, EmptyState } from './src/Surface';
export { Tabs } from './src/Tabs';
