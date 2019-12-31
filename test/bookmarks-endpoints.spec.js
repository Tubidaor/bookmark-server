const { expect } = require('chai')
const knex = require('knex')
const app = require('../src/app')
const  { makeBookmarksArray } = require('./bookmark-fixtures')

describe.only('Bookmark Endpoints', function() {
  let db

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL,
    })
    app.set('db', db)
  })
    



  after('disconnect from db', () => db.destroy())

  before('clean the table', () => db('bookmarks').truncate())

  afterEach('cleanup', () => db('bookmarks').truncate())

  context(`Given no bookmarks`, () => {
    it(`responds with 200 and an empty list`, () => {
      return supertest(app)
        .get('/bookmarks')
        .expect(200, [])
    })

    it(`responds with 404`, () => {
      const BmId = 9
        return supertest(app)
        .get(`/bookmarks/${BmId}`)
        .expect(404, { error: { message: `Bookmark doesn't exist` } })
      })
  })

  context('Given there are bookmarks in the database', () => {
    const testBookmarks = makeBookmarksArray()
      
    
    beforeEach('insert bookmarks', () => {
      return db
        .into('bookmarks')
        .insert(testBookmarks)
    })

    it('GET /bookmarks responds with 200 and all of the articles', () => {
      return supertest(app)
        .get('/bookmarks')
        .expect(200, testBookmarks)
    })

    it('GET /bookmarks/:BmId responds with 200 and the specified article', () => {
      const BmId = 2
      const expectedBookmark = testBookmarks[BmId - 1]
        return supertest(app)
          .get(`/bookmarks/${BmId}`)
          .expect(200, expectedBookmark)
    })

  })

  describe.only(`POST /bookmarks`, () => {
    it(`creates a bookmark, responding with 201 and the new bookmark`, function() {
      this.retries(3)
      const newBookmark = {
        title: 'Reedit',
        url: 'www.reddit.com',
        description: 'Test new article content...',
        rating: 2
      }
      return supertest(app)
        .post('/bookmarks')
        .send(newBookmark)
        .expect(201)
        .expect(res => {
          expect(res.body.title).to.eql(newBookmark.title)
          expect(res.body.url).to.eql(newBookmark.url)
          expect(res.body.rating).to.eql(newBookmark.rating)
          expect(res.body).to.have.property('id')
          expect(res.headers.location).to.eql(`/bookmarks/${res.body.id}`)
        })
        .then(res =>
          supertest(app)
            .get(`/bookmarks/${res.body.id}`)
            .expect(res.body)
        )
    })
  })
})