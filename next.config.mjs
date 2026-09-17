import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.env.NEXT_TEST_WASM_DIR = path.join(
  __dirname,
  "node_modules",
  "@next",
  "swc-wasm-nodejs"
);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
