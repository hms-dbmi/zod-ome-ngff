# zod-ome-ngff

[![Node version](https://img.shields.io/npm/v/zod-ome-ngff.svg)](https://www.npmjs.com/package/zod-ome-ngff)
![GitHub Actions](https://github.com/hms-dbmi/zod-ome-ngff/actions/workflows/ci.yml/badge.svg)

[zod](https://github.com/colinhacks/zod) schemas for
[ome-ngff](https://github.com/ome/ngff). modules are generated
from the NGFF JSON specification and manually refined, providing 
composable validators for working with NGFF
metadata in JavaScript and TypeScript.

## install

```sh
pnpm install zod zod-ome-ngff
```

## usage

```typescript
import { z } from "zod";
import * as v04 from "zod-ome-ngff/v04";

let Attrs = z.union([
  v04.StrictImageSchema,
  v04.StrictLabelSchema,
  v04.StrictPlateSchema,
  v04.StrictWellSchema,
]);

let url =
  "https://uk1s3.embassy.ebi.ac.uk/idr/zarr/v0.4/idr0048A/9846152.zarr/";

// The following throws a `z.ZodError` if the `.zattrs`
// JSON does not conform to the union schema above.
let attrs = Attrs.parse(
  await fetch(`${url}.zattrs`).then((res) => res.json()),
);

// TypeScript now _knows_ the type of attrs

attrs;
//^? StrictImageSchema | StrictLabelSchema | StrictPlateSchema | StrictWellSchema

if ("multiscales" in attrs) {
  console.log("Multiscales:", attrs.multiscales);
}                           //^? StrictImageSchema

if ("image-label" in attrs) {
  console.log("Label:", attrs["image-label"]);
}                     //^? StrictLabelSchema

if ("well" in attrs) {
  console.log("Well:", attrs.well);
}                    //^? StrictWellSchema

if ("plate" in attrs) {
  console.log("Plate:", attrs.plate);
}                     //^? StrictPlateSchema
```

## sub-packages

Validators are exported for `v0.1`, `v0.2`, `v0.3`, and `v0.4` schemas.

```typescript
import * as v01 from "zod-ome-ngff/0.1";
import * as v02 from "zod-ome-ngff/0.2";
import * as v03 from "zod-ome-ngff/0.3";
import * as v04 from "zod-ome-ngff/0.4";

import * as schemas from "zod-ome-ngff"; // latest
```

## development

The contents of `src/` are automatically generated from the
[NGFF JSON specification](https://github.com/ome/ngff) via:

```sh
git module init
git module update
# or
git submodule update --remote --merge # to update the submodule commit
```

```sh
node scripts/generate-schemas.mjs latest # or 0.1, 0.2, 0.3, 0.4, latest
```

## changelogs

For changes to be reflected in package changelogs, run `pnpm changeset` and
follow the prompts.

> **Note** not every PR requires a changeset. Since changesets are focused on
> releases and changelogs, changes to the repository that don't effect these
> won't need a changeset (e.g., documentation, tests).

## release

The [Changesets GitHub action](https://github.com/changesets/action) will create
and update a PR that applies changesets and publishes new versions.

## related

- [`ome/ngff`](https://github.com/ome/ngff) - offcial specification (JSON schemas)
- [`JaneliaSciComp/pydantic-ome-ngff`](https://github.com/JaneliaSciComp/pydantic-ome-ngff) - pydantic models for ngff (Python) 
