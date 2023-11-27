"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dev = void 0;
const combining_1 = require("./lib/combining");
function dev() {
    (0, combining_1.combining)({
        createdUser: null,
        updatedUser: null,
        _id: "655f07fcc4933dc3e0873f11",
        customerCode: "KBS0000001",
        quotaNumber: "40000001",
        storeFrontNumber: "STORE123",
        agriculturalistCode: 123456,
        currentDebtStatus: "Active",
        sugarCaneFarmerType: 2,
        farmerGradeCode: "0E",
        debtorFarmerTypeCode: "SUP",
        extensionAreasCode: "C4",
        normalRate: "5%",
        lateRate: "10%",
        createdAt: "2023-11-23T15:06:20+07:00",
        __v: 0,
    }, {
        replaces: {
            MASTER_URL: "http://kbs.cnes.co.th/gateway/masters",
        },
        headers: {},
        includes: [
            {
                url: "CMS_URL/customers",
                model: "includeCustomer",
                on: "customerCode",
                method: "GET",
                at: "data.list",
                local: "customerCode",
                foreign: "identities",
            },
            {
                url: "MASTER_URL/extensionAreas",
                model: "includeExtensionAreas",
                on: "extensionAreasCode",
                query: {
                    pagination: {
                        page: 1,
                        limit: 100,
                    },
                },
                method: "GET",
                at: "data.list",
                local: "extensionAreasCode",
                foreign: "filter[extensionAreasCode]",
            },
            {
                url: "MASTER_URL/farmerGrades",
                model: "includeFarmerGrade",
                on: "farmerGradeCode",
                query: {
                    pagination: {
                        page: 1,
                        limit: 100,
                    },
                },
                method: "GET",
                at: "data.list",
                local: "farmerGradeCode",
                foreign: "filter[farmerGradeCode]",
            },
            {
                url: "MASTER_URL/debtorFarmerTypes",
                model: "includeDebtorFarmerTypes",
                on: "debtorFarmerTypeCode",
                query: {
                    pagination: {
                        page: 1,
                        limit: 100,
                    },
                },
                method: "GET",
                at: "data.list",
                local: "debtorFarmerTypeCode",
                foreign: "filter[debtorFarmerTypeCode]",
            },
        ],
    })
        .then((data) => {
        console.log(data);
    })
        .catch((e) => {
        console.log(e);
    });
    // including({
    //   replaces: {
    //     JSON_PLACE_HOLDER: "https://jsonplaceholder.typicode.com",
    //   },
    //   headers: {
    //     "x-consumer-id": 1,
    //   },
    //   list: [
    //     {
    //       url: "https://jsonplaceholder.typicode.com/users",
    //       method: "GET",
    //       model: "users",
    //       query: {
    //         id: [1, 2, 3, 4, 5], // sample only 5 users by id[]=1&id[]=2...
    //       },
    //       sessions: {},
    //       includes: [
    //         {
    //           url: "https://jsonplaceholder.typicode.com/posts",
    //           method: "GET",
    //           model: "includePosts",
    //           on: "id",
    //           duplicate: false,
    //           foreign: "userId",
    //           each: true, // including will HTTP to url each items in parent (5 times from example)
    //           selects: ["id", "body", "includeUser"],
    //           includes: [
    //             Include.buildIncludeQueryList({
    //               requestTo: "https://jsonplaceholder.typicode.com/users",
    //               methodIs: "GET",
    //               modelName: "includeUser",
    //               selectFields: [
    //                 "id",
    //                 "name",
    //                 "address.street",
    //                 "address.zipcode",
    //               ],
    //               isDuplicate: false,
    //               valueFrom: "userId",
    //               sendName: "id",
    //               mappingBy: "id",
    //             }),
    //             // {
    //             //   url: "https://jsonplaceholder.typicode.com/users",
    //             //   method: "GET",
    //             //   model: "includeUser",
    //             //   selects: ["id", "name", "address.street", "address.zipcode"],
    //             //   duplicate: false,
    //             //   on: "userId",
    //             //   foreign: "id",
    //             //   local: "id",
    //             // },
    //           ],
    //         },
    //       ],
    //     },
    //   ],
    // })
    //   .then((data) => {
    //     console.log(JSON.stringify(data));
    //   })
    //   .catch((e) => {});
}
exports.dev = dev;
