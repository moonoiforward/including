const express = require('express')
const { including } = require('including')
const app = express()
const port = 3000

app.get('/', (req, res) => {
  res.send('Hello World!')
})
app.get('/posts-with-data', (req, res) => {
  including({
    list: [
      {
        url: 'https://jsonplaceholder.typicode.com/posts',
        method: 'GET',
        model: 'posts',
        query: req.query,
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
    res.json(data);
  })
})
app.get('/posts/:id/with-data', (req, res) => {
  const id = req.params['id'];
  including({
    list: [
      {
        url: 'https://jsonplaceholder.typicode.com/posts/' + id,
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
    res.json(data);
  })
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})