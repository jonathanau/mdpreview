import { vi } from 'vitest';

// Minimal DOM mocks needed for CodeMirror in jsdom
HTMLCanvasElement.prototype.getContext = vi.fn();
window.getSelection = vi.fn(() => ({
  rangeCount: 0,
  getRangeAt: vi.fn(),
  removeAllRanges: vi.fn(),
  addRange: vi.fn(),
}));
document.createRange = vi.fn(() => ({
  setStart: vi.fn(),
  setEnd: vi.fn(),
  getClientRects: vi.fn(() => []),
  getBoundingClientRect: vi.fn(() => ({ left: 0, top: 0, right: 0, bottom: 0 })),
  collapse: vi.fn(),
}));

// Mock IntersectionObserver for CodeMirror
class MockIntersectionObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.IntersectionObserver = MockIntersectionObserver;

// Mock ResizeObserver for CodeMirror
class MockResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = MockResizeObserver;
