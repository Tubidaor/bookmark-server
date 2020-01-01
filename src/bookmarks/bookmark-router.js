const express = require('express')
const bookRouter = express.Router()
const jsonParser = express.json()
const uuid = require('uuid/v4')
const logger = require('../logger')
// const { bookmarks } = require('../store')
const BookmarksService = require('../bookmarks-service')
const xss = require('xss')

const sterilizeBm = bookmark => ({
  id: bookmark.id,
  title: xss(bookmark.title),
  url: bookmark.url,
  description: xss(bookmark.description),
  rating: bookmark.rating
})



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
        res.json(bookmarks.map(sterilizeBm))
    })
    .catch(next)
  })
  .post(jsonParser, (req, res, next) => {
    const { title, url, description, rating } = req.body
    const newBookmark = { title, url, description, rating }
    const requiredFields = {title, url, rating }
    for (const [key, value] of Object.entries(requiredFields)) {
      if (value == null) {
        return res.status(400).json({
          error: { message: `Missing '${key}' in request body` }
        })
      }
    }
    BookmarksService.insertBookmark(
      req.app.get('db'),
      newBookmark
    )
      .then(bookmark => {
        res
          .status(201)
          .location(`/bookmarks/${bookmark.id}`)
          .json(sterilizeBm(bookmark))
      })
      .catch(next)
  })


  bookRouter
    .route('/bookmarks/:id')
    .all((req, res, next) => {
      BookmarksService.getById(
        req.app.get('db'),
        req.params.id
      )
      .then(bookmark => {
        if (!bookmark) {
          return res.status(404).json({
            error: { message: `Bookmark doesn't exist` }
          })
        }
        res.bookmark = bookmark
        next()
      })
      .catch(next)
    })
    .get((req, res, next) => {
      res.json(sterilizeBm(res.bookmark))
    })
    .delete((req, res, next) => {
      BookmarksService.deleteBookmark(
        req.app.get('db'),
        req.params.id
      )
      .then(numRowsAffected => {
        res.status(204).end()
      })
      .catch(next)
  })

  module.exports = bookRouter
  