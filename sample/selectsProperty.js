const { including } = require('..');
including({
  list: [
    {
      url: "https://jsonplaceholder.typicode.com/posts",
      method: "GET",
      model: "includePosts",
      selects: ["id", "body", "includeUser"],
      includes: [
        {
          url: "https://jsonplaceholder.typicode.com/users",
          method: "GET",
          model: "includeUser",
          selects: ["id", "name", 'address.street', 'address.zipcode'],
          duplicate: false,
          on: "userId",
          foreign: "id",
          local: "id",
        },
      ],
    },
  ]
}).then(data => {
  console.log(JSON.stringify(data));
})