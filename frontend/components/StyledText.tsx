import { Text, TextProps } from './Themed';

/**
 * Monospace text component that applies the SpaceMono font family.
 * Extends the themed Text component with consistent monospace styling.
 * Used for displaying code snippets, file paths, and technical information.
 */
export function MonoText(props: TextProps) {
  return <Text {...props} style={[props.style, { fontFamily: 'SpaceMono' }]} />;
}
