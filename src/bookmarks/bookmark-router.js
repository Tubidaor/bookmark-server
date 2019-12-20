const express = require('express')
const bookRouter = express.Router()
const bodyParser = express.json()
const uuid = require('uuid/v4')
const logger = require('../logger')
const { bookmarks } = require('../store')



bookRouter
  .route('/bookmarks')
  .get((req, res) => {
    res
    .json(bookmarks)
  })
  .post(bodyParser, ( req, res) => {
    const { title, url, description, rating } = req.body
    if(!title) {
    logger.error("title required")
    
    return  res
        .status(404)
        .send("invalid Data")
    }

    if(!url) {
      logger.error('URL required')

      return res
        .status(404)
        .send("invalid Data")
    }

    const id = uuid()

    const bookmark = {
      id,
      title,
      url,
      description,
      rating
    }

    bookmarks.push(bookmark)

    res.json(bookmarks)
  })

  bookRouter
    .route('/bookmarks/:id')
    .get((req, res) => {

      const  { id } = req.params
      bookmarkSearch = bookmarks.find(bm => bm.id === id)
      
      if(!bookmarkSearch) {
        
        return  res
        .status(404)
        .send("bookmark not found")
      }

      res.json(bookmarkSearch)
    })
    .delete((req, res) => {
      const { id } = req.params;
  
      const bookmarkIndex = bookmarks.findIndex(b => b.id === id);
    
      if ( bookmarkIndex === -1 ) {
        logger.error(`Bookmark with id ${id} not found.`);
        return res
          .status(404)
          .send('Not found');
      }
    
      bookmarks.splice(bookmarkIndex, 1);
    
      logger.info(`Card with id ${id} deleted.`);
    
      res
        .status(204)
        .end();
    })

  module.exports = bookRouter
  