import { responseFields } from "./NicoSearchConst.js";
import { ErrorResponse, SearchAPIResponse, SearchParams } from "./@types/NicoSearch.js";
import { fetch } from "undici";

const apiUrl = "https://api.search.nicovideo.jp/api/v2/snapshot/video/contents/search";

export default async function search<P extends SearchParams>({
  q,
  fields,
}: P): Promise<SearchAPIResponse<P["fields"]>> {
  if (fields === "*") {
    fields = responseFields;
  }

  try {
    const url = new URL(apiUrl);
    url.search = new URLSearchParams({
      q,
      targets: "tagsExact",
      fields: "contentId",
      sort: "-viewCounter",
      limit: String(10),
    }).toString();

    const req = await fetch(url);

    if (!req.ok) {
      throw new Error(`Niconico API lỗi: ${req.status} ${req.statusText}`);
    }

    const text = await req.text();
    if (!text.trim()) {
      throw new Error("Niconico API trả về response rỗng");
    }

    const res = JSON.parse(text) as any;

    return res;
  } catch (err: any) {
    if (err?.response) {
      const { meta } = err.response as ErrorResponse;
      throw {
        name: "NiconicoSearchAPIResponseError",
        meta,
      };
    }
    throw err;
  }
}
