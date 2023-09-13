import { including } from "./lib/including";

export function dev() {
  including({
    replaces: {
      JSON_PLACE_HOLDER: "https://jsonplaceholder.typicode.com",
    },
    headers: {
      "x-consumer-id": 1,
    },
    list: [
      {
        url: "JSON_PLACE_HOLDER/albums",
        method: "GET",
        model: "albums",
        excludes: ["id"],
        includes: [],
      },
    ],
  })
    .then((data) => {
      console.log(JSON.stringify(data));
    })
    .catch((e) => {
      console.log(e);
    });
}
