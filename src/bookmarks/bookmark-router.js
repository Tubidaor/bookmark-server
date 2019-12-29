const express = require('express')
const bookRouter = express.Router()
const bodyParser = express.json()
const uuid = require('uuid/v4')
const logger = require('../logger')
// const { bookmarks } = require('../store')
const BookmarksService = require('../bookmarks-service')


bookRouter
  .route('/')
  .get((req, res) =>
    res.send("Hello, world!"))

bookRouter
  .route('/bookmarks')
  .get((req, res, next) => {
    // res
    // .json(bookmarks)
    const knexInstance = req.app.get('db')
    BookmarksService.getAllBookmarks(knexInstance)
      .then(bookmarks => {
        res.json(bookmarks)
    })
    .catch(next)
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
      // bookmarkSearch = bookmarks.find(bm => bm.id === id)
      const knexInstance = req.app.get('db')
      
      // if(!bookmarkSearch) {
        
      //   return  res
      //   .status(404)
      //   .send("bookmark not found")
      // }

      BookmarksService.getById(knexInstance, id)
        .then(BmById => {
          if(!BmById) {
            return res.status(404).json({
              error: { message: `Bookmark doesn't exist` }
            })
          }
          res.json(BmById)
        })

      // res.json(bookmarkSearch)
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
  