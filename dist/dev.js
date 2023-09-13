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
                url: "JSON_PLACE_HOLDER/albums",
                method: "GET",
                model: "albums",
                excludes: ["id"],
                includes: [
                    {
                        url: "http://104.248.158.156:8110/departments",
                        method: "GET",
                        model: "includeDepartment",
                        select: "data",
                        on: "id",
                        delimiter: ",",
                        foreign: "filter[DepartmentID]",
                        local: "DepartmentID",
                    },
                    {
                        url: "http://104.248.158.156:8110/regionalProvinces",
                        method: "GET",
                        model: "includeRegionalProvince",
                        select: "data",
                        on: "userId",
                        foreign: "filter[in][RegionalProvinceID]",
                        local: "RegionalProvinceID",
                    },
                ],
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
exports.dev = dev;
