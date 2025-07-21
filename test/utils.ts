import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as url from "node:url";

import * as glob from "glob";
import { z } from "zod";
import camelcase from "camelcase";

let __dirname = path.dirname(url.fileURLToPath(import.meta.url));
let fixtures = path.join(__dirname, "..");

export function globber(version: string) {
  return async (pattern: string) => {
    let files = await glob.glob(
      path.join(fixtures, version, "examples", pattern),
    );
    return files.map((file) => ({
      name: path.basename(file),
      path: file,
      json: () => fs.readFile(file, { encoding: "utf-8" }).then((text) => {
        const exampleObject = JSON.parse(text);
        if (version === "0.5") {
          // Starting with v0.5, the examples are structured like Zarr v3 zarr.json contents.
          return exampleObject["attributes"];
        }
        return exampleObject;
      }),
    }));
  };
}

let Test = z.object({
  formerly: z.string(),
  data: z.any(),
  valid: z.boolean(),
});

let Suite = z.object({
  description: z.string(),
  schema: z.object({
    id: z.string(),
  }),
  tests: z.array(Test),
});

export async function gather_test_cases<T extends Record<string, z.ZodSchema>>(
  version: "0.4" | "0.5" | "latest",
  schemas: T,
) {
  let files = await glob.glob(
    path.join(__dirname, "..", version, "/tests/*.json"),
  );

  let cases = files.map(async (file) => {
    let suite = await fs.readFile(file, "utf-8")
      .then(JSON.parse)
      .then(Suite.parse);

    let cased = camelcase(suite.schema.id.split("/").pop()!);
    let name = cased.charAt(0).toUpperCase() +
      cased.slice(1) as keyof typeof schemas;

    return Object.assign(suite, { Schema: schemas[name] });
  });

  return Promise.all(cases);
}
