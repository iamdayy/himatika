import { EventHandlerRequest, H3Event, MultiPartData } from "h3";

export async function customReadMultipartFormData<T>(
  event: H3Event<EventHandlerRequest>
) {
  const multiPartsData = await readMultipartFormData(event);

  const parsedData: { [key: string]: string | MultiPartData } = {};
  if (multiPartsData) {
    for (const data of multiPartsData) {
      if (data.name) {
        // Check if the field is a file
        if (data.type) {
          parsedData[data.name] = {
            name: data.filename,
            data: data.data,
            type: data.type
          };
        } else {
          // Assume it's a text field, try to parse as JSON if it looks like one
          const value = data.data.toString("utf8");
          parsedData[data.name] = value;
          // try {
          //   parsedData[data.name] = JSON.parse(value);
          // } catch (e) {
          // }
        }
      }
    }
  }
  return parsedData;
}
