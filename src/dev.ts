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
        url: "https://jsonplaceholder.typicode.com/posts",
        method: "GET",
        model: "posts",
        frame: "list",
        timeout: 1000,
        onSuccess: (err, client, result) => {
          // console.log(err, client, result);
        },
        onDone: (err, data) => {
          // console.log(err, data);
        },
        branches: [
          {
            url: "https://jsonplaceholder.typicode.com/users",
            method: "GET",
            model: "brancheUsers",
            on: "list.userId",
            foreign: "id",
            local: "id",
            buildQuery: (data) => {
              return null;
            },
          },
        ],
      },
    ],
  })
    .then((data) => {
      console.log(data)
      console.log(JSON.stringify(data));
    })
    .catch((e) => {
      console.log(e);
    });
}
