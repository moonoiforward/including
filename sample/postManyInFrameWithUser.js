const { including } = require('../');
including({
  list: [
    {
      url: 'https://raw.githubusercontent.com/moonoiforward/including/main/json/posts.1.json',
      method: 'GET',
      model: 'posts',
      select: 'data',
      includes: [
        {
          url: 'https://raw.githubusercontent.com/moonoiforward/including/main/json/users.json',
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