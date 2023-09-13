const { including } = require('../');
including({
  list: [
    {
      url: 'https://raw.githubusercontent.com/moonoiforward/including/main/json/posts.1.json',
      method: 'GET',
      model: 'posts',
      select: 'data', // where is result (object or array) for mapping
      includes: [
        {
          url: 'https://raw.githubusercontent.com/moonoiforward/including/main/json/usersWithFrame.json',
          method: 'GET',
          model: 'includeUser',
          on: 'userId',
          foreign: 'id',
          local: 'id',
          select: 'data' // where is result (object or array) for mapping
        }
      ]
    }
  ]
}).then(data => {
  console.log(data);
})