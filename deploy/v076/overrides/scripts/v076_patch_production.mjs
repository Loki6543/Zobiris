import { readFile, writeFile } from "node:fs/promises";

async function replaceOnce(path, from, to) {
  const original = await readFile(path, "utf8");
  if (!original.includes(from)) {
    throw new Error(`v0.7.6 production patch anchor missing in ${path}`);
  }
  await writeFile(path, original.replace(from, to), "utf8");
}

await replaceOnce(
  "src/ui/App.tsx",
  `  const pageMeta = {
    command: [
      "Command Center",
      "Real-time evidence integrity and decision support",
    ],`,
  `  const pageMetaByView: Record<View, readonly [string, string]> = {
    command: [
      "Command Center",
      "Real-time evidence integrity and decision support",
    ],`,
);

await replaceOnce(
  "src/ui/App.tsx",
  `    "execution-readiness": [
      "Execution Readiness",
      "Fill probability, toxicity, order-book motion and capacity",
    ],
  }[view];`,
  `    "execution-readiness": [
      "Execution Readiness",
      "Fill probability, toxicity, order-book motion and capacity",
    ],
    "attention-ignition": [
      "Attention Ignition",
      "Early attention acceleration, source confirmation and lead-state evidence",
    ],
    "ownership-risk": [
      "Ownership Risk",
      "Concentration, holder structure and shadow-only risk-veto evidence",
    ],
  };
  const pageMeta = pageMetaByView[view];`,
);

await replaceOnce(
  "src/strategy21/engine/personality.ts",
  `function mean(values: number[]): number {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

`,
  "",
);

await writeFile(
  "tsconfig.production.json",
  JSON.stringify(
    {
      extends: "./tsconfig.json",
      compilerOptions: {
        types: ["node", "vite/client"],
        noEmit: true,
      },
      include: ["src/**/*.ts", "src/**/*.tsx", "vite.config.ts"],
      exclude: [
        "node_modules",
        "dist",
        "src/tests/**",
        "src/strategy21/tests/**",
        "src/strategy21/types/node-shim.d.ts",
      ],
    },
    null,
    2,
  ) + "\n",
  "utf8",
);
