declare global {
  interface Window {
    divi: Record<string, unknown>;
  }
}

export type ReferencesTreeViewProps = {
  data: Record<string, string[]>;
}