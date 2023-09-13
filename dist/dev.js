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
                url: "https://jsonplaceholder.typicode.com/users",
                method: "GET",
                model: "users",
                query: {
                    id: [1, 2, 3, 4, 5], // sample only 5 users by id[]=1&id[]=2...
                },
                sessions: {},
                includes: [
                    {
                        url: "https://jsonplaceholder.typicode.com/posts",
                        method: "GET",
                        model: "includePosts",
                        on: "id",
                        duplicate: false,
                        foreign: "userId",
                        each: true,
                        includes: [
                            {
                                url: "https://jsonplaceholder.typicode.com/users",
                                method: "GET",
                                model: "includeUser",
                                duplicate: false,
                                on: "userId",
                                foreign: "id",
                                local: "id",
                            },
                        ],
                    },
                ],
            },
        ],
    })
        .then((data) => { })
        .catch((e) => { });
}
exports.dev = dev;
