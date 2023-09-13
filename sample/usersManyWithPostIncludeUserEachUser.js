const { including } = require('../');
including({
  list: [
    {
      url: 'https://jsonplaceholder.typicode.com/users',
      method: 'GET',
      model: 'users',
      query: {
        id: [1, 2, 3, 4, 5] // sample only 5 users by id[]=1&id[]=2...
      },
      includes: [
        {
          url: 'https://jsonplaceholder.typicode.com/posts',
          method: 'GET',
          model: 'includePosts',
          on: 'id',
          foreign: 'userId',
          each: true, // including will HTTP to url each items in parent (5 times from example)
          includes: [
            {
              url: 'https://jsonplaceholder.typicode.com/users',
              method: 'GET',
              model: 'includeUser',
              on: 'userId',
              foreign: 'id',
              local: 'id'
            }
          ]
        }
      ]
    }
  ]
}).then(data => {
  console.log(JSON.stringify(data));
})