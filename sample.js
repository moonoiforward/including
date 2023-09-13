const { including } = require('.');
including(
  {
    list: [
      {
        url: "https://jsonplaceholder.typicode.com/posts",
        method: "GET",
        model: "posts",
        includes: [
          {
            url: "https://jsonplaceholder.typicode.com/users",
            method: "GET",
            model: "includeUser",
            params: ['userId'],
            on: 'userId',
            foreign: 'userId',
            local: 'id'
          },
        ],
      },
    ]
  }
).then(data => {
  console.log(JSON.stringify(data));
})