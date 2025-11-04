import { z } from "zod";
import { to_date } from "./shared.js";

export const VersionSchema = z
  .enum(["0.5"])
  .describe("The version of the OME-Zarr Metadata");


function withVersion<T1 extends z.ZodRawShape, T2 extends z.ZodObject<T1>>(InnerSchema: T2) {
  return z.object({
    ome: InnerSchema.extend({
      version: VersionSchema,
    }).describe("The versioned OME-Zarr Metadata namespace"),
  }).describe("The zarr.json attributes key");
}

// PLATE

const StrictAquisition = z.object({
  id: z
    .number()
    .int()
    .gte(0)
    .describe(
      "A unique identifier within the context of the plate"
    ),
  maximumfieldcount: z
    .number()
    .int()
    .gt(0)
    .describe(
      "The maximum number of fields of view for the acquisition"
    ),
  name: z.string().describe("The name of the acquisition"),
  description: z
    .string()
    .describe("The description of the acquisition")
    .optional(),
  starttime: z
    .number()
    .int()
    .gte(0)
    .describe(
      "The start timestamp of the acquisition, expressed as epoch time i.e. the number seconds since the Epoch"
    )
    .transform(to_date)
    .optional(),
  endtime: z
    .number()
    .int()
    .gte(0)
    .describe(
      "The end timestamp of the acquisition, expressed as epoch time i.e. the number seconds since the Epoch"
    )
    .transform(to_date)
    .optional(),
});

const Aquisition = StrictAquisition.partial({
  maximumfieldcount: true,
  name: true,
});

const Columns = z
  .array(
    z.object({
      name: z
        .string()
        .regex(new RegExp("^[A-Za-z0-9]+$"))
        .describe("The column name"),
    }),
  )
  .min(1)
  .superRefine((rows, ctx) => {
    let names = rows.map((row) => row.name);
    if (rows.length !== new Set(names).size) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `No duplicates columns allowed.`,
      });
    }
  })
  .describe("The columns of the plate");

const Rows = z
  .array(
    z.object({
      name: z
        .string()
        .regex(new RegExp("^[A-Za-z0-9]+$"))
        .describe("The row name"),
    }),
  )
  .min(1)
  .superRefine((rows, ctx) => {
    let names = rows.map((row) => row.name);
    if (rows.length !== new Set(names).size) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `No duplicates rows allowed.`,
      });
    }
  })
  .describe("The rows of the plate");

const PlateWells = z
  .array(
    z.object({
      path: z
        .string()
        .regex(new RegExp("^[A-Za-z0-9]+/[A-Za-z0-9]+$"))
        .describe("The path to the well subgroup"),
      rowIndex: z
        .number()
        .int()
        .gte(0)
        .describe("The index of the well in the rows list"),
      columnIndex: z
        .number()
        .int()
        .gte(0)
        .describe("The index of the well in the columns list"),
    }),
  )
  .min(1)
  .describe("The wells of the plate");

const FieldCount = z
  .number()
  .int()
  .gt(0)
  .describe("The maximum number of fields per view across all wells")
  .optional();

function createPlateSchema<T extends z.ZodTypeAny>(Aquisition: T) {
  return z.object({
    name: z.string().describe("The name of the plate"),
    acquisitions: z.array(Aquisition)
      .describe("The acquisitions for this plate")
      .optional(),
    field_count: FieldCount,
    columns: Columns,
    rows: Rows,
    wells: PlateWells,
  });
}

export const PlateSchema = withVersion(z.object({
  plate: createPlateSchema(Aquisition).partial({ name: true }),
}));

export const StrictPlateSchema = withVersion(z.object({
  plate: createPlateSchema(StrictAquisition),
}));

// BF2Raw

export const Bf2RawSchema = withVersion(z.object({
  "bioformats2raw.layout": z
    .literal(3)
    .describe(
      "The top-level identifier metadata added by bioformats2raw"
    ),
}));

// OME

export const OmeSchema = withVersion(z.object({
  series: z
    .array(z.string())
    .describe(
      "An array of the same length and the same order as the images defined in the OME-XML"
    )
}));

// Image

const Axis = z.object({
  name: z.string(),
  type: z.string().default("space"),
  unit: z.string().optional(),
});

const Axes = z.array(Axis)
  .min(2)
  .superRefine((axes, ctx) => {
    let names = axes.map((ax) => ax.name);
    if (axes.length !== new Set(names).size) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `No duplicate axes allowed.`,
      });
    }
    if (axes.length > 5) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Too many axes.`,
      });
    }
    let total_space_axes = axes.filter((ax) => ax.type === "space").length;
    if (total_space_axes <= 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Missing space axes.",
      });
    }
    if (total_space_axes > 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Too many space axes.",
      });
    }
  });

const CoordinateTransformation = z.union([
  z.object({ type: z.enum(["identity"]) }),
  z.object({
    type: z.enum(["scale"]),
    scale: z.array(z.number()).min(2),
  }),
  z.object({
    type: z.enum(["translation"]),
    translation: z.array(z.number()).min(2),
  }),
]);

const CoordinateTransformations = z.array(CoordinateTransformation)
  .min(1)
  .superRefine((ts, ctx) => {
    let scales = ts.filter((t): t is { type: "scale"; scale: number[] } =>
      t.type === "scale"
    );
    let unique_scales = new Set(scales.map((s) => s.scale.join(".")));
    if (scales.length !== unique_scales.size) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `No duplicate scale transformations allowed.`,
      });
    }
    if (
      ts.some((t) => t.type === "translation") &&
      scales.length === 0
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Missing scale for translation.`,
      });
    }
  });

const StrictMultiscale = z.object({
  name: z.string(),
  datasets: z
    .array(
      z.object({
        path: z.string(),
        coordinateTransformations: CoordinateTransformations,
      }),
    )
    .min(1),
  axes: Axes,
  coordinateTransformations: CoordinateTransformations.optional(),
});

const Multiscale = StrictMultiscale.partial({
  name: true,
});

const Omero = z.object({
  channels: z.array(
    z.object({
      window: z
        .object({
          end: z.number(),
          max: z.number(),
          min: z.number(),
          start: z.number(),
        })
        .optional(),
      label: z.string().optional(),
      family: z.string().optional(),
      color: z.string().optional(),
      active: z.boolean().optional(),
    })
  ),
});

function createImageSchema<T extends z.ZodTypeAny>(Multiscale: T) {
  return z.object({
    multiscales: z.array(Multiscale)
      .min(1)
      .describe("The multiscale datasets for this image"),
    omero: Omero.optional(),
  });
}

export const ImageSchema = withVersion(createImageSchema(Multiscale));

export const StrictImageSchema = withVersion(createImageSchema(StrictMultiscale));

// Label

const StrictImageLabelSchema = z.object({
  colors: z
    .array(
      z.object({
        "label-value": z.number().describe("The value of the label"),
        rgba: z
          .array(z.number().int().gte(0).lte(255))
          .min(4)
          .max(4)
          .describe(
            "The RGBA color stored as an array of four integers between 0 and 255",
          )
          .optional(),
      }),
    )
    .min(1)
    .describe("The colors for this label image")
    .superRefine((colors, ctx) => {
      let label_values = colors.map((color) => color["label-value"]);
      if (colors.length !== new Set(label_values).size) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `No duplicate color_labels allowed.`,
        });
      }
    }),
  properties: z
    .array(
      z.object({
        "label-value": z
          .number()
          .int()
          .describe("The pixel value for this label"),
      }),
    )
    .min(1)
    .describe("The properties for this label image")
    .optional(),
  source: z
    .object({ image: z.string().optional() })
    .describe("The source of this label image")
    .optional(),
});

const ImageLabelSchema = StrictImageLabelSchema.partial({
  colors: true,
});

export const LabelSchema = withVersion(z.object({
  "image-label": ImageLabelSchema
}));

export const StrictLabelSchema = withVersion(z.object({
  "image-label": StrictImageLabelSchema
}));

// Well

const StrictInnerWellSchema = z.object({
  images: z
    .array(
      z.object({
        acquisition: z
          .number()
          .int()
          .describe("A unique identifier within the context of the plate")
          .optional(),
        path: z
          .string()
          .regex(new RegExp("^[A-Za-z0-9]+$"))
          .describe("The path for this field of view subgroup"),
      }),
    )
    .min(1)
    .describe("The fields of view for this well")
    .superRefine((imgs, ctx) => {
      let paths = imgs.map((img) => img.path);
      if (imgs.length !== new Set(paths).size) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `No duplicate images allowed.`,
        });
      }
    }),
});

export const WellSchema = withVersion(z.object({
  well: StrictInnerWellSchema.partial({ })
}));

export const StrictWellSchema = withVersion(z.object({
  well: StrictInnerWellSchema
}));

export const OmeZarrSchema = z.union([ 
  Bf2RawSchema,
  ImageSchema,
  ImageLabelSchema,
  OmeSchema,
  PlateSchema,
  WellSchema,
]);
