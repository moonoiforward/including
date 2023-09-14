"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dev = void 0;
const including_1 = require("./lib/including");
function dev() {
    (0, including_1.including)({
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
                query: {
                    id: [1, 2, 3, 4, 5],
                },
                onSuccess: (err, client, data) => {
                    console.log(client);
                },
                branches: [
                    {
                        url: "https://jsonplaceholder.typicode.com/users",
                        method: "GET",
                        model: "brancheUsers",
                        on: "data.userId",
                        foreign: "id",
                        onSuccess: (err, client, data) => {
                            console.log(client);
                        },
                    },
                ],
            },
        ],
    })
        .then((data) => {
        console.log(JSON.stringify(data, null, 4));
    })
        .catch((e) => { });
}
exports.dev = dev;
