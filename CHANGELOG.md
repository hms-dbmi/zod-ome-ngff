# zod-ome-ngff

## 0.3.0

### Minor Changes

- Add v0.5 schema. ([#20](https://github.com/hms-dbmi/zod-ome-ngff/pull/20))

## 0.2.0

### Minor Changes

- feat: parse integer datetimes (seconds) as UTC `Date` objects ([#14](https://github.com/manzt/zod-ome-ngff/pull/14))

  ```typescript
  import { StrictPlateSchema } from "zod-ome-ngff";

  let { plate } = StrictPlateSchema.parse({
    /* ... */
  });

  for (let acq of plate.acquisitions!) {
    if (acq.starttime) acq.starttime;
    //^? Date
    if (acq.endtime) acq.endtime;
  } //^? Date
  ```

## 0.1.4

### Patch Changes

- refactor: replace custom validators using zod generics ([#11](https://github.com/manzt/zod-ome-ngff/pull/11))

## 0.1.3

### Patch Changes

- fix: loosen strictness for "metadata" and "type" in image multiscales since not specified in NGFF spec ([#8](https://github.com/manzt/zod-ome-ngff/pull/8))

- chore: rename package zod-ome-ngff ([#9](https://github.com/manzt/zod-ome-ngff/pull/9))

## 0.1.2

### Patch Changes

- fix: build package in publish script... ([`7a0bafc`](https://github.com/manzt/zod-ome-ngff/commit/7a0bafc9d0e399ee56c686bac3c91c9e7a32346b))

## 0.1.1

### Patch Changes

- feat: manual refinement of generated zod schemas ([#5](https://github.com/manzt/zod-ome-ngff/pull/5))

## 0.1.0

### Minor Changes

- fix: refinement of complex `axes` and `coordinateTransformations` schema ([#3](https://github.com/manzt/zod-ome-ngff/pull/3))

### Patch Changes

- feat: generate a `latest` export ([`14acb18`](https://github.com/manzt/zod-ome-ngff/commit/14acb186721e6094d64f31999103ec53a4654487))
