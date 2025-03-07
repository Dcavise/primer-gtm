/// <reference types="vite/client" />

// Define SVG imports for TypeScript
declare module "*.svg" {
  const content: string;
  export default content;
}
