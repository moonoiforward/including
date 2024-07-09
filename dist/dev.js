"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dev = void 0;
const including_1 = require("./lib/including");
function dev() {
    // combining(
    //   {
    //     createdUser: null,
    //     updatedUser: null,
    //     _id: "655f07fcc4933dc3e0873f11",
    //     customerCode: "KBS0000001",
    //     customerCodes: ["KBS0000001", "KBS0000002"],
    //     quotaNumber: "40000001",
    //     storeFrontNumber: "STORE123",
    //     agriculturalistCode: 123456,
    //     currentDebtStatus: "Active",
    //     sugarCaneFarmerType: 2,
    //     farmerGradeCode: "0E",
    //     debtorFarmerTypeCode: "SUP",
    //     extensionAreasCode: "C4",
    //     normalRate: "5%",
    //     lateRate: "10%",
    //     createdAt: "2023-11-23T15:06:20+07:00",
    //     __v: 0,
    //   },
    //   {
    //     replaces: {
    //       MASTER_URL: "http://165.232.160.175:8000/masters",
    //       CMS_URL: "http://165.232.160.175:8081",
    //     },
    //     headers: {},
    //     includes: [
    //       {
    //         url: "CMS_URL/customers",
    //         model: "includeCustomer",
    //         on: "customerCode",
    //         method: "GET",
    //         at: "data.list",
    //         local: "customerCode",
    //         foreign: "filter[customerCode]",
    //       },
    //       {
    //         url: "CMS_URL/customers",
    //         model: "includeCustomers",
    //         on: "customerCodes",
    //         method: "GET",
    //         at: "data.list",
    //         local: "customerCode",
    //         foreign: "identities",
    //       },
    //       {
    //         url: "MASTER_URL/extensionAreas",
    //         model: "includeExtensionAreas",
    //         on: "extensionAreasCode",
    //         query: {
    //           pagination: {
    //             page: 1,
    //             limit: 100,
    //           },
    //         },
    //         method: "GET",
    //         at: "data.list",
    //         local: "extensionAreasCode",
    //         foreign: "filter[extensionAreasCode]",
    //       },
    //       {
    //         url: "MASTER_URL/farmerGrades",
    //         model: "includeFarmerGrade",
    //         on: "farmerGradeCode",
    //         query: {
    //           pagination: {
    //             page: 1,
    //             limit: 100,
    //           },
    //         },
    //         method: "GET",
    //         at: "data.list",
    //         local: "farmerGradeCode",
    //         foreign: "filter[farmerGradeCode]",
    //       },
    //       {
    //         url: "MASTER_URL/debtorFarmerTypes",
    //         model: "includeDebtorFarmerTypes",
    //         on: "debtorFarmerTypeCode",
    //         query: {
    //           pagination: {
    //             page: 1,
    //             limit: 100,
    //           },
    //         },
    //         method: "GET",
    //         at: "data.list",
    //         local: "debtorFarmerTypeCode",
    //         foreign: "filter[debtorFarmerTypeCode]",
    //       },
    //     ],
    //   }
    // )
    //   .then((data) => {
    //     console.log(data);
    //   })
    //   .catch((e) => {
    //     console.log(e);
    //   });
    (0, including_1.including)({
        replaces: {
            JSON_PLACE_HOLDER: "https://jsonplaceholder.typicode.com",
            MAIN_SERVICE_URL: "https://kbs-dev.cnes.co.th/gateway/no-auth-main-service",
            CMS_SERVICE_URL: "https://kbs-dev.cnes.co.th/gateway/no-auth-cms-service",
            MASTER_SERVICE_URL: "https://kbs-dev.cnes.co.th/gateway/masters",
        },
        headers: {
            "x-consumer-id": 1,
        },
        list: [
            {
                url: "CMS_SERVICE_URL/data-book-banks",
                query: {},
                model: "bookBanks",
                at: "data",
                method: "GET",
                includes: [
                    {
                        url: "CMS_SERVICE_URL/customers",
                        model: "includeCustomer",
                        on: "list.customerCode",
                        method: "GET",
                        at: "data.list",
                        local: "customerCode",
                        foreign: "filter[customerCode]",
                        includes: [
                            {
                                url: "MASTER_SERVICE_URL/prefixs",
                                method: "GET",
                                model: "includePrefix",
                                on: "prefixId",
                                at: "data.list",
                                local: "code",
                                foreign: "filter[code_isInt]",
                            },
                        ],
                    },
                    {
                        url: "MASTER_SERVICE_URL/banks/by/bankCode/$1",
                        model: "includeBank",
                        params: ["list.bankCode"],
                        method: "GET",
                        at: "data",
                    },
                    {
                        url: "MASTER_SERVICE_URL/bankBranches/where/bankCode/bankBranchCode/=/$1/$2",
                        model: "includeBankBranch",
                        params: ["list.bankCode", "list.bankBranchCode"],
                        query: { mode: "one" },
                        method: "GET",
                        at: "data",
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
