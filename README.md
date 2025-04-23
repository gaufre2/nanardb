# NanarDB (WIP)

A "Nanar" database ([cf. french article of Nanar][wikipedia-fr-nanar]) can be utilized through a GraphQL API, for educational purposes.

## Technologies

Since this is a learning project, some of the selected technologies might appear to be more advanced than necessary for its scope.

- [Node.js v22 LTS][node]: JS Runtime.
- [JavaScript][js]/[TypeScript][ts]: Programming language.
- [NestJS][nestjs]: Back-end framework.
- [PostgreSQL][postgres]: SQL database.
- [Prisma][prisma]: ORM.
- [Apollo][apollo]: GraphQL server.
- [Puppeteer][puppeteer]: Browser API used for scrapping.
- [Redis][redis]: Cache.
- [Axios][axios]: Promise based HTTP client.
- [Jest][jest]: Testing framework.
- [pnpm][pnpm]: Package manager.
- [SWC][swc]: Compiler for JS/TS.
- [ESLint][eslint]/[typescript-eslint][typescript-eslint]: Linter.
- [Prettier][prettier]: Code formatter.
- [Docker][docker]: Container engine.
- [Development Containers][devcontainer]: Container development.

[wikipedia-fr-nanar]: https://fr.wikipedia.org/wiki/Nanar
[node]: https://nodejs.org
[js]: https://developer.mozilla.org/en-US/docs/Web/JavaScript
[ts]: https://www.typescriptlang.org/
[nestjs]: https://nestjs.com/
[postgres]: https://www.postgresql.org/
[prisma]: https://www.prisma.io/
[apollo]: https://www.apollographql.com/
[puppeteer]: https://pptr.dev/
[redis]: https://redis.io/
[axios]: https://axios-http.com/
[jest]: https://jestjs.io/
[pnpm]: https://pnpm.io/
[swc]: https://swc.rs/
[eslint]: https://eslint.org/
[typescript-eslint]: https://typescript-eslint.io/
[prettier]: https://prettier.io/
[docker]: https://www.docker.com/
[devcontainer]: https://containers.dev/

## To do list

- [ ] Populate the DB with Nanarland reviews data:
  - [x] Fetch reviews links.
  - [x] Scrape review data.
  - [x] Store useful data into DB.
  - [ ] Automate the scrapping process.
- [ ] Link movies to a TMDb id:
  - [x] Retrieve movie ID based on name and year.
  - [ ] Handle cases where the movie is not found.
  - [x] Fetch additional movie data from TMDb.
- [x] Cache fetched online content in Redis.
- [ ] Store movie posters outside the database.
- [ ] Enable database interaction through GraphQL:
  - [ ] Update a review.
  - [ ] Retrieve a sorted list based on specified arguments.
