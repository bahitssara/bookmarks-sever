const { expect } = require('chai')
const knex = require('knex')
const app = require('../src/app')
const fixtures = require('./bookmarks.fixtures')
const { makeBookmarksArray, makeMaliciousBookmark } = require('../test/bookmarks.fixtures')

describe('Bookmarks Endpoints', function() {
    let db

    before('make knex instance', () => {
        db = knex({
            client: 'pg',
            connection: process.env.TEST_DB_URL
        })
        app.set('db', db)
    })

    after('disconnect from db', () => db.destroy())

    before('clean the table', () => db('bookmarks').truncate())

    afterEach('cleanup', () => db('bookmarks').truncate())

    describe('GET /bookmarks', () => {
        context(`Given no bookmarks`, () => {
            it(`responds with 200 and an empty list`, () => {
                return supertest(app)
                .get('/bookmarks')
                .set('Authorization', `Bearer ${process.env.API_KEY}`)
                .expect(200, [])
            })
        })

        context('Given there are bookmarks in the database', () => {
            const testBookmarks = fixtures.makeBookmarksArray()

            beforeEach('insert bookmarks', () => {
                return db
                  .into('bookmarks')
                  .insert(testBookmarks)
              })
    
              it('GET /bookmarks responds with 200 and all of the bookmarks', () => {
                  return supertest(app)
                    .get('/bookmarks')
                    .set('Authorization', `Bearer ${process.env.API_KEY}`)
                    .expect(200, testBookmarks)
              })
        }) 
        
        context(`Given an XSS attack bookmarks`, () => {
            const { maliciousBookmark, expectedBookmark } = fixtures.makeMaliciousBookmark()
      
            beforeEach('insert malicious bookmarks', () => {
              return db
                .into('bookmarks')
                .insert([ maliciousBookmark ])
            })
      
            it('removes XSS attack content', () => {
              return supertest(app)
                .get(`/bookmarks`)
                .expect(200)
                .set('Authorization', `Bearer ${process.env.API_KEY}`)
                .expect(res => {
                  expect(res.body[0].title).to.eql(expectedBookmark.title)
                  expect(res.body[0].body).to.eql(expectedBookmark.body)
                })
            })
          })
    })
    

    describe('GET /bookmarks/:id', () => {
        context(`Given no bookmarks`, () => {
            it(`responds with 404`, () => {
                const bookmarkId = 123456
                return supertest(app)
                    .get(`/bookmarks/1`)
                    .set('Authorization', `Bearer ${process.env.API_KEY}`)
                    .expect(404, { error: { message: `Bookmark doesn't exist` } })
            })
        })
        context('Given there are bookmarks in the database', () => {
            const testBookmarks = fixtures.makeBookmarksArray()

            beforeEach('insert bookmarks', () => {
                return db
                  .into('bookmarks')
                  .insert(testBookmarks)
            })

            it('GET /bookmarks/:id responds with 200 and the specified articile', () => {
                  const id = 2
                  const expectedBookmark = testBookmarks[id - 1]
                  return supertest(app)
                    .get(`/bookmarks/${id}`)
                    .set('Authorization', `Bearer ${process.env.API_KEY}`)
                    .expect(200, expectedBookmark)
            })
        }) 

        context(`Given an XSS attack bookmark`, () => {
            const { maliciousBookmark, expectedBookmark } = fixtures.makeMaliciousBookmark()
      
            beforeEach('insert malicious bookmark', () => {
              return db
                .into('bookmarks')
                .insert([maliciousBookmark])
            })
      
            it('removes XSS attack content', () => {
              return supertest(app)
                .get(`/bookmarks/${maliciousBookmark.id}`)
                .set('Authorization', `Bearer ${process.env.API_KEY}`)
                .expect(200)
                .expect(res => {
                  expect(res.body.title).to.eql(expectedBookmark.title)
                  expect(res.body.body).to.eql(expectedBookmark.body)
                })
            })
          })
    })

    describe(`POST /bookmarks`, () => {
        it(`responds with 400 and an error message when the 'title' is missing`, () => {
            const newBookmarkMissingTitle = {
                //title: 'test bookmark',
                body: 'Test Body Two',
                weburl: 'www.bookmark1.com',
                rating: 2,
            }
            return supertest(app)
                .post('/bookmarks')
                .send(newBookmarkMissingTitle)
                .set('Authorization', `Bearer ${process.env.API_KEY}`)
                .expect(400, {
                    error: { message: `Missing 'title' in request` }
                })
        })
    
        it(`responds with 400 and an error message when the 'body' is missing`, () => {
            const newBookmarkMissingBody = {
                title: 'test bookmark',
                //body: 'Test Body Two',
                weburl: 'www.bookmark1.com',
                rating: 2,
            }
            return supertest(app)
                .post('/bookmarks')
                .send(newBookmarkMissingBody)
                .set('Authorization', `Bearer ${process.env.API_KEY}`)
                .expect(400, {
                    error: { message: `Missing 'body' in request` }
                })
        })
    
        it(`responds with 400 and an error message when the 'weburl' is missing`, () => {
            const newBookmarkMissingUrl = {
                title: 'test bookmark',
                body: 'Test Body Two',
                //weburl: 'www.bookmark1.com',
                rating: 2,
            }
            return supertest(app)
                .post('/bookmarks')
                .send(newBookmarkMissingUrl)
                .set('Authorization', `Bearer ${process.env.API_KEY}`)
                .expect(400, {
                    error: { message: `Missing 'weburl' in request` }
                })
        })

        it(`responds with 400 invalid 'rating' if not a rating between 0-5`, () => {
            const newBookmarkInvalidRating = {
                title: 'test bookmark',
                body: 'Test Body Two',
                weburl: 'www.bookmark1.com',
                //rating: 'invalid',
            }
            return supertest(app)
                .post('/bookmarks')
                .send(newBookmarkInvalidRating)
                .set('Authorization', `Bearer ${process.env.API_KEY}`)
                .expect(400, {
                    error: { message: `'rating', rating must be between 0-5`}
                })
        })

        it(`creates a bookmark, responding with 201 and the new bookmark`, ()  => {
            const newBookmark = {
              title: 'test bookmark',
              body: 'Test Body Two',
              weburl: 'https://www.test.com',
              rating: 2,
            }
            return supertest(app)
              .post('/bookmarks')
              .send(newBookmark)
              .set('Authorization', `Bearer ${process.env.API_KEY}`)
              .expect(201)
              .expect(res => {
                expect(res.body.title).to.eql(newBookmark.title)
                expect(res.body.body).to.eql(newBookmark.body)
                expect(res.body.weburl).to.eql(newBookmark.weburl)
                expect(res.body.rating).to.eql(newBookmark.rating)
                expect(res.body).to.have.property('id')
                expect(res.headers.location).to.eql(`/bookmarks/${res.body.id}`)
              })
              .then(res =>
                supertest(app)
                  .get(`/bookmarks/${res.body.id}`)
                  .set('Authorization', `Bearer ${process.env.API_KEY}`)
                  .expect(res.body)
              )
          })

          it('removes XSS attack content from response', () => {
            const { maliciousBookmark, expectedBookmark } = fixtures.makeMaliciousBookmark()
            return supertest(app)
              .post(`/bookmarks`)
              .send(maliciousBookmark)
              .set('Authorization', `Bearer ${process.env.API_KEY}`)
              .expect(201)
              .expect(res => {
                expect(res.body.title).to.eql(expectedBookmark.title)
                expect(res.body.body).to.eql(expectedBookmark.body)
              })
          })
      
      })

      describe(`DELETE /bookmarks/:id`, () => {
        context(`Given no bookmarks`, () => {
            it(`responds with 404`, () => {
                return supertest(app)
                     .delete(`/bookmarks/1234`)
                     .set('Authorization', `Bearer ${process.env.API_KEY}`)
                     .expect(404, { error: {message: `Bookmark doesn't exist` } })
            })
        })
        context('Given there are bookmarks in the database', () => {
          const testBookmarks = fixtures.makeBookmarksArray()
     
          beforeEach('insert bookmarks', () => {
            return db
              .into('bookmarks')
              .insert(testBookmarks)
          })
     
          it('responds with 204 and removes the bookmarks', () => {
            const idToRemove = 2
            const expectedBookmarks = testBookmarks.filter(bookmark => bookmark.id !== idToRemove)
            return supertest(app)
              .delete(`/bookmarks/${idToRemove}`)
              .set('Authorization', `Bearer ${process.env.API_KEY}`)
              .expect(204)
              .then(() =>
                supertest(app)
                  .get(`/bookmarks`)
                  .set('Authorization', `Bearer ${process.env.API_KEY}`)
                  .expect(expectedBookmarks)
              )
          })
        })
     })
})
