// ============================================
// MindCare Sanctuary — Vitest Test Setup
// JSDOM Environment polyfills & Three.js mocks
// ============================================

// Mock window.matchMedia
if (typeof window !== 'undefined') {
  window.matchMedia = window.matchMedia || function (query) {
    return {
      matches: false,
      media: query,
      onchange: null,
      addListener: function () {},
      removeListener: function () {},
      addEventListener: function () {},
      removeEventListener: function () {},
      dispatchEvent: function () { return true; }
    };
  };

  // Mock IntersectionObserver
  class MockIntersectionObserver {
    constructor(callback) {
      this.callback = callback;
    }
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  window.IntersectionObserver = window.IntersectionObserver || MockIntersectionObserver;

  // Mock HTMLCanvasElement.getContext for Three.js in jsdom
  HTMLCanvasElement.prototype.getContext = function (type) {
    if (type === 'webgl' || type === 'experimental-webgl' || type === 'webgl2') {
      return {
        getExtension: () => null,
        getParameter: (param) => {
          if (param === 7938) return 'WebGL 1.0 (Mock)'; // gl.VERSION
          if (param === 7937) return 'WebKit WebGL';     // gl.RENDERER
          if (param === 7936) return 'WebKit';           // gl.VENDOR
          if (param === 35661) return 16;                // gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS
          if (param === 34930) return 16;                // gl.MAX_TEXTURE_IMAGE_UNITS
          if (param === 3379) return 4096;               // gl.MAX_TEXTURE_SIZE
          if (param === 34076) return 4096;              // gl.MAX_CUBE_MAP_TEXTURE_SIZE
          return 0;
        },
        getShaderPrecisionFormat: () => ({ rangeMin: 1, rangeMax: 1, precision: 1 }),
        enable: () => {},
        disable: () => {},
        clear: () => {},
        clearColor: () => {},
        createTexture: () => ({}),
        bindTexture: () => {},
        texParameteri: () => {},
        createProgram: () => ({}),
        createShader: () => ({}),
        shaderSource: () => {},
        compileShader: () => {},
        attachShader: () => {},
        linkProgram: () => {},
        useProgram: () => {},
        createBuffer: () => ({}),
        bindBuffer: () => {},
        bufferData: () => {},
        viewport: () => {},
        drawArrays: () => {},
        drawElements: () => {}
      };
    }
    return null;
  };
}
