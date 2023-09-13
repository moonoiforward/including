const { including } = require('../');
including({
  list: [
    {
      url: 'https://jsonplaceholder.typicode.com/posts/1',
      method: 'GET',
      model: 'posts',
      includes: [
        {
          url: 'https://jsonplaceholder.typicode.com/users/$1',
          method: 'GET',
          model: 'includeUser',
          params: ['userId']
        }
      ]
    }
  ]
}).then(data => {
  console.log(data);
})