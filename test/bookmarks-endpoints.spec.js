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
        .get('/api/bookmarks')
        .expect(200, [])
    })

    it(`responds with 404`, () => {
      const BmId = 87
        return supertest(app)
        .get(`/api/bookmarks/${BmId}`)
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
        .get('/api/bookmarks')
        .expect(200, testBookmarks)
    })

    it('GET /bookmarks/:BmId responds with 200 and the specified article', () => {
      const BmId = 2
      const expectedBookmark = testBookmarks[BmId - 1]
        return supertest(app)
          .get(`/api/bookmarks/${BmId}`)
          .expect(200, expectedBookmark)
    })

  })

  context(`Given an XSS attack bookmark`, () => {
    const maliciousBookmark = {
    id: 911,
    title: 'Naughty naughty very naughty <script>alert("xss");</script>',
    url: 'www.howto.com',
    description: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
    rating: 3
    }
    
    beforeEach('insert malicious bookmark', () => {
      return db
        .into('bookmarks')
        .insert([ maliciousBookmark ])
      })
    
      it('removes XSS attack content', () => {
        return supertest(app)
          .get(`/api/bookmarks/${maliciousBookmark.id}`)
          .expect(200)
          .expect(res => {
            expect(res.body.title).to.eql('Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;')
            expect(res.body.description).to.eql(`Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`)
          })
      })
  })


  describe(`POST /bookmarks`, () => {
    it(`creates a bookmark, responding with 201 and the new bookmark`, function() {
      this.retries(3)
      const newBookmark = {
        title: 'Reddit',
        url: 'www.reddit.com',
        description: 'Test new article content...',
        rating: 2
      }
      const ratingValue = [1, 2, 3, 4, 5]
      return supertest(app)
        .post('/api/bookmarks')
        .send(newBookmark)
        .expect(201)
        .expect(res => {
          expect(res.body.title).to.eql(newBookmark.title)
          expect(res.body.url).to.eql(newBookmark.url)
          expect(res.body.rating).to.eql(newBookmark.rating)
          expect(res.body).to.have.property('id')
          expect(res.body.rating).to.be.a('number')
          expect(ratingValue).to.include(res.body.rating)
          expect(res.headers.location).to.eql(`/api/bookmarks/${res.body.id}`)
        })
        .then(res =>
          supertest(app)
            .get(`/api/bookmarks/${res.body.id}`)
            .expect(res.body)
        )
    })

    const requiredFields = ['title', 'url', 'rating']
    
    requiredFields.forEach(field => {
      const newBookmark = {
        title: 'Test new bookmark',
        url: 'wwww.newbookmark.com',
        rating: 3
      }
    
      it(`responds with 400 and an error message when the '${field}' is missing`, () => {
        delete newBookmark[field]
    
        return supertest(app)
          .post('/api/bookmarks')
          .send(newBookmark)
          .expect(400, {
            error: { message: `Missing '${field}' in request body` }
          })
      })
    })
  })

  describe(`DELETE /bookmarks/:id`, () => {
    context(`Given no bookmarks`, () => {
      it(`responds with 404`, () => {
        const BmId = 123456
        return supertest(app)
          .delete(`/api/bookmarks/${BmId}`)
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

      it('responds with 204 and removes the article', () => {
        const idToRemove = 2
        const expectedBookmarks = testBookmarks.filter(bookmark => bookmark.id !== idToRemove)
        return supertest(app)
          .delete(`/api/bookmarks/${idToRemove}`)
          .expect(204)
          .then(res =>
            supertest(app)
              .get(`/api/bookmarks`)
              .expect(expectedBookmarks)
          )
      })
    })
  })

  describe(`PATCH /api/bookmarks/:id`, () => {
    context(`Given no bookmarks`, () => {
      it(`responds with 404`, () => {
        const bookmarkId = 123456
        return supertest(app)
          .patch(`/api/bookmarks/${bookmarkId}`)
          .expect(404, { error: { message: `Bookmark doesn't exist` } })
      })
    })
  })

context('Given there are bookmarks in the database', () => {
  const testBookmarks = makeBookmarksArray()
  beforeEach('insert bookmarks', () => {
      return db
        .into('bookmarks')
        .insert(testBookmarks)
    })

  it('responds with 204 and updates the bookmark', () => {
    const idToUpdate = 2
    const updateBookmark = {
      title: 'updated bookmark title',
      url: 'www.updatedurl.com',
      description: 'updated bookmark content',
      rating: 3
    }

    const expectedBookmark = {
      ...testBookmarks[idToUpdate - 1],
      ...updateBookmark
    }

    return supertest(app)
      .patch(`/api/bookmarks/${idToUpdate}`)
      .send(updateBookmark)
      .expect(204)
      .then(res =>
        supertest(app)
        .get(`/api/bookmarks/${idToUpdate}`)
        .expect(expectedBookmark)
      )
  })

  it(`responds with 400 when no required fields supplied`, () => {
    const idToUpdate = 2
    return supertest(app)
      .patch(`/api/bookmarks/${idToUpdate}`)
      .send({ irrelevantField: 'foo' })
      .expect(400, {
        error: {
        message: `Request body must contain either 'title', 'url', 'description' or 'rating'`
        }
      })
  })

  it(`responds with 204 when updating only a subset of fields`, () => {
    const idToUpdate = 2
    const updateBookmark = {
      title: 'updated bookmark title',
    }
    const expectedBookmark = {
      ...testBookmarks[idToUpdate - 1],
      ...updateBookmark
    }

    return supertest(app)
      .patch(`/api/bookmarks/${idToUpdate}`)
      .send({
        ...updateBookmark,
        fieldToIgnore: 'should not be in GET response'
      })
      .expect(204)
      .then(res =>
        supertest(app)
        .get(`/api/bookmarks/${idToUpdate}`)
        .expect(expectedBookmark)
      )
    })
  })
})