const { including } = require('../');
including({
  list: [
    {
      url: 'https://jsonplaceholder.typicode.com/posts',
      method: 'GET',
      model: 'posts',
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
}).then(data => {
  console.log(data);
})