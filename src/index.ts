import fs from "fs";
import { Image, createCanvas, loadImage } from "./napi-canvas";
import { Result } from "./response-result";

interface Attribute {
  trait_type: string;
  value: string;
}

interface JourneyData {
  name: string;
  attributes: Attribute[];
}

type Layer = {
  path: string;
  priority: number;
};

const HEIGHT = 6855;
const WIDTH = 5484;
const BASE_PATH = process.cwd();
const LAYER_PATH = "/layers";
const OUTPUT_PATH = "/outputs";
const JOURNEY_DATA_PATH = "/src/journey.json";

const JOURNEY_LAYERS_CONFIG: Layer[] = [
  {
    path: `${LAYER_PATH}/OVERLAYS`,
    priority: 1,
  },
  {
    path: `${LAYER_PATH}/SPECIAL-COMBO`,
    priority: 2,
  },
  {
    path: `${LAYER_PATH}/SPECIAL`,
    priority: 3,
  },
  {
    path: `${LAYER_PATH}/ROAD`,
    priority: 4,
  },
  {
    path: `${LAYER_PATH}/HORIZON-COMBOS`,
    priority: 5,
  },
  {
    path: `${LAYER_PATH}/HORIZON`,
    priority: 6,
  },
  {
    path: `${LAYER_PATH}/SKY`,
    priority: 7,
  },
];

const getImages = async (attributes: Attribute[]) => {
  return await Promise.all(
    attributes.map(async (attribute) => {
      return new Promise<Image>(async (resolve, reject) => {
        const { trait_type: l, value: t } = attribute;
        try {
          const imagePath = `${BASE_PATH}${LAYER_PATH}/${l}/${t}.png`;
          return resolve(await loadImage(imagePath));
        } catch (error) {
          if (error instanceof Error) {
            return reject(
              "Something went wrong when quering the image" + error.message
            );
          }
          return reject("Something went wrong when quering the image");
        }
      });
    })
  );
};

type GetTraitElementImageReturn = Result<Buffer | null>;

export const getTraitElementImageFromGCP = ({
  l,
  t,
}: {
  l: string;
  t: string;
}): Promise<GetTraitElementImageReturn> => {
  return new Promise<Result<Buffer>>(async (resolve, reject) => {
    fs.readFile(
      `${BASE_PATH}${LAYER_PATH}/${l}/${t}.png`,
      "utf-8",
      (err, data) => {
        if (err) {
          console.error(err);
          return reject(Result.fail("No image found"));
        }
        resolve(Result.ok(Buffer.from(data)));
      }
    );
  }).catch((error) => {
    if (error instanceof Error) {
      return Result.fail(error.message);
    }
    return Result.fail("Something went wrong");
  });
};

const main = async () => {
  // open journey.json
  fs.readFile(BASE_PATH + JOURNEY_DATA_PATH, "utf-8", async (err, data) => {
    if (err) {
      console.error(err);
      return;
    }

    // parse the "data" value in data
    const journeyData: JourneyData[] = JSON.parse(data).data;

    for (const data of journeyData) {
      await new Promise(async (resolve, reject) => {
        const canvas = createCanvas(WIDTH, HEIGHT);
        const ctx = canvas.getContext("2d");
        const { attributes, name } = data;
        await getImages(attributes)
          .then((images) => {
            /** Fetch Images */
            images.forEach((image) => {
              ctx.drawImage(image, 0, 0, WIDTH, HEIGHT);
            });

            /** Save */
            const buffer = canvas.toBuffer("image/png");
            fs.writeFileSync(`${BASE_PATH}${OUTPUT_PATH}/${name}.png`, buffer);

            /** Debug Controls */
            console.log(`Saved ${name}`);
            fs.appendFileSync(
              BASE_PATH + OUTPUT_PATH + "/debug.txt",
              `Saved ${name}\n`
            );
          })
          .catch((err) => {
            /** Debug Controls */
            console.error(`Failed to save ${name}: ${err.message}`);
            fs.appendFileSync(
              BASE_PATH + OUTPUT_PATH + "/debug.txt",
              `Failed to save ${name}: ${err.message}\n`
            );
          });

        resolve("Done");
      });
    }
  });
};

main();
