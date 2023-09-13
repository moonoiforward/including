# Including.js
Low code HTTP client can be combine and including data from multiple endpoint for the node.js don't use in browser, please don't use.
You don't need for loop any more for combine data

## Features

- http multiple endpoint in multi task process
- in each endpoint process can be including other http for joining data and not limit dimension (includes)
- create main data list from belong data such as contents list from favorite list (branches)

## Example From https://jsonplaceholder.typicode.com

##### Example one item
You can get post data by id = 1 from https://jsonplaceholder.typicode.com/posts/1

```json
{
  "userId": 1,
  "id": 1,
  "title": "sunt aut facere repellat provident occaecati excepturi optio reprehenderit",
  "body": "quia et suscipit\nsuscipit recusandae consequuntur expedita et cum\nreprehenderit molestiae ut ut quas totam\nnostrum rerum est autem sunt rem eveniet architecto"
}
```
and you need to be combine user data from https://jsonplaceholder.typicode.com/users/1

```json
{
    "id": 1,
    "name": "Leanne Graham",
    "username": "Bret",
    "email": "Sincere@april.biz"
}
```
combine to be
```json
{
  "userId": 1,
  "id": 1,
  "title": "sunt aut facere repellat provident occaecati excepturi optio reprehenderit",
  "body": "quia et suscipit\nsuscipit recusandae consequuntur expedita et cum\nreprehenderit molestiae ut ut quas totam\nnostrum rerum est autem sunt rem eveniet architecto",
  "includeUser": {
    "id": 1,
    "name": "Leanne Graham",
    "username": "Bret",
    "email": "Sincere@april.biz"
  }
}
```
if you use general node.js the code it look like
```js
  const post = (await fetch('https://jsonplaceholder.typicode.com/posts/1')).json();
  const user = (await fetch('https://jsonplaceholder.typicode.com/posts/' + post.userId)).json();
  post.includeUser = user
```

you can use including for this result by node.js example
```js
const { including } = require('including');
including({
    list: [
      {
        url: "https://jsonplaceholder.typicode.com/posts/1",
        method: "GET",
        model: "posts",
        includes: [
          {
            url: "https://jsonplaceholder.typicode.com/users/$1",
            method: "GET",
            model: "includeUser",
            params: ['userId'] // bring userId from posts to replace the url $1
          },
        ],
      },
    ]
  }).then(data => {
    console.log(data);
})
```

##### Example list item

You can get posts data from https://jsonplaceholder.typicode.com/posts

```json
[
  {
    "userId": 1,
    "id": 1,
    "title": "sunt aut facere repellat provident occaecati excepturi optio reprehenderit",
    "body": "quia et suscipit\nsuscipit recusandae consequuntur expedita et cum\nreprehenderit molestiae ut ut quas totam\nnostrum rerum est autem sunt rem eveniet architecto"
  },
  {
    "userId": 2,
    "id": 2,
    "title": "qui est esse",
    "body": "est rerum tempore vitae\nsequi sint nihil reprehenderit dolor beatae ea dolores neque\nfugiat blanditiis voluptate porro vel nihil molestiae ut reiciendis\nqui aperiam non debitis possimus qui neque nisi nulla"
  }
]
```
and you need to combine user data to be

```json
[
  {
    "userId": 1,
    "id": 1,
    "title": "sunt aut facere repellat provident occaecati excepturi optio reprehenderit",
    "body": "quia et suscipit\nsuscipit recusandae consequuntur expedita et cum\nreprehenderit molestiae ut ut quas totam\nnostrum rerum est autem sunt rem eveniet architecto",
    "includeUser": {
        "id": 1,
        "name": "Leanne Graham",
        "username": "Bret",
        "email": "Sincere@april.biz"
    }
  },
  {
    "userId": 2,
    "id": 2,
    "title": "qui est esse",
    "body": "est rerum tempore vitae\nsequi sint nihil reprehenderit dolor beatae ea dolores neque\nfugiat blanditiis voluptate porro vel nihil molestiae ut reiciendis\nqui aperiam non debitis possimus qui neque nisi nulla",
    "includeUser": {      
      "id": 2,
      "name": "Ervin Howell",
      "username": "Antonette",
      "email": "Shanna@melissa.tv"
    }
  }
]
```
you can get users list by filter id list by https://jsonplaceholder.typicode.com/users?id[]=1&id[]=2

```
?id[]=1&id[]=2
```
the result is 
```json
[
  {
    "id": 1,
    "name": "Leanne Graham",
    "username": "Bret",
    "email": "Sincere@april.biz"
  },
  {
    "id": 2,
    "name": "Ervin Howell",
    "username": "Antonette",
    "email": "Shanna@melissa.tv"
  }
]
```
in general node.js the code it look like
```js
  const posts = (await fetch('https://jsonplaceholder.typicode.com/posts')).json();
  const userIds = posts.map(item => item.userId);
  const queryString = someQueryStringBuilder({id: userIds}) // result is id[]=1&id[]=2&id=.....
  const users = (await fetch('https://jsonplaceholder.typicode.com/users/?' + queryString)).json();
  for (let post of posts) {
    const findUser = users.find(item => item.id === post.userId);
    if (findUser) {
      post.includeUser = findUser;
    }
  }
```
you can use including for this result by node.js example
```js
const { including } = require('including');
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
            on: 'userId', // bring userId from posts to query users
            foreign: 'id', // for query string id[]=1&id[]=2
            local: 'id' // the identity field from users result
          },
        ],
      },
    ]
  }
).then(data => {
  console.log(JSON.stringify(data));
})
```
if your api look like ?id=1,2,3,4,5,6
```js
const { including } = require('including');
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
            delimiter: ',', // add "delimiter" for make query in delimiter format
            on: 'userId', // bring userId from posts to query users
            foreign: 'id', // for query string id[]=1&id[]=2
            local: 'id' // the identity field from users result
          },
        ],
      },
    ]
  }
).then(data => {
  console.log(JSON.stringify(data));
})
```