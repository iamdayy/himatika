import { IncomingMessage } from "http";
import csvtojson from "csvtojson";
import formidable from "formidable";
export default defineEventHandler(async (event) => {
  const nodeReqObject = event.node.req;
  const headers = getRequestHeaders(event);
  let file: string;

  file = await handleFile(event.node.req);

  const data = await csvtojson().fromFile(file);
  return {
    ok: true,
    data,
  };
});

function handleFile(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const from = formidable({ multiples: false });
    from.parse(req, (err, fields, files) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(files.file![0].filepath);
    });
  });
}
