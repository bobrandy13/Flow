import "@testing-library/jest-dom/vitest";

// jsdom polyfills required by @xyflow/react
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
class DOMMatrixReadOnlyMock {
  m22 = 1;
}
const g = globalThis as unknown as {
  ResizeObserver?: unknown;
  DOMMatrixReadOnly?: unknown;
};
if (typeof g.ResizeObserver === "undefined") {
  g.ResizeObserver = ResizeObserverMock;
}
if (typeof g.DOMMatrixReadOnly === "undefined") {
  g.DOMMatrixReadOnly = DOMMatrixReadOnlyMock;
}
