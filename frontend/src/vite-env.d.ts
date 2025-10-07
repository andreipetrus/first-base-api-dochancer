/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TEST_MODE?: string
  readonly VITE_TEST_CLAUDE_KEY?: string
  readonly VITE_TEST_API_KEY?: string
  readonly VITE_TEST_PRODUCT_URL?: string
  readonly VITE_TEST_DOC_URL?: string
  readonly VITE_TEST_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}