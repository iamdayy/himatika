import { EventHandlerRequest, H3Event } from "h3";

export async function customReadMultipartFormData<T>(
  event: H3Event<EventHandlerRequest>
) {
  const multiPartsData = await readMultipartFormData(event);

  const parsedData: { [key: string]: any } = {};
  if (multiPartsData) {
    for (const data of multiPartsData) {
      if (data.name) {
        // Check if the field is a file
        if (data.type) {
          parsedData[data.name] = {
            name: data.filename,
            data: data.data,
            type: data.type,
            size: data.data.length,
            lastModified: new Date(),
          };
        } else {
          // Assume it's a text field, try to parse as JSON if it looks like one
          const value = data.data.toString("utf8");
          try {
            parsedData[data.name] = JSON.parse(value);
          } catch (e) {
            parsedData[data.name] = value;
          }
        }
      }
    }
  }
  return parsedData;
}
