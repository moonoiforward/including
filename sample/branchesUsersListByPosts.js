const { including } = require('..');
including({
  list: [
    {
      url: 'https://jsonplaceholder.typicode.com/posts',
      method: 'GET',
      model: 'posts',
      branches: [
        {
          url: 'https://jsonplaceholder.typicode.com/users',
          method: 'GET',
          model: 'brancheUsers',
          on: 'userId',
          foreign: 'id',
          local: 'id',
        }
      ]
    }
  ]
}).then(data => {
  console.log(JSON.stringify(data));
})