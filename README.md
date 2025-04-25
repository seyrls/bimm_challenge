# BIMM Challenge
## Data structure
This is how the project's structure currently looks like.
```
bimm_challenge/
├── src/
│   ├── db                       # Main folder for migrations
│   │   ├── migrations/          # Files for data migrations
│   ├── graphql                  # GraphQL Schema file
│   ├── main.ts                  # Application entry point
│   ├── app.module.ts            # Root module
│   ├── vehicles/                # Vehicles module
│   │   ├── entities/            # TypeORM entities
│   │   ├── resolvers/           # GraphQL resolvers
│   │   ├── services/            # Business logic services
│   │   └── vehicles.module.ts   # Vehicles module definition
│   └── xml-parser/              # XML parsing module
│       ├── services/            # XML parsing services
│       ├── interfaces/          # Interface definitions
│       └── xml-parser.module.ts # Module definition
├── test/                        # End-to-end tests
├── Dockerfile                   # Docker configuration
├── docker-compose.yml           # Docker Compose for local development
```
## API
The project pulls data from the required APIs `Parse all the Makes` and `Get all the Vehicle Types per Make`.
According to their [specification](https://vpic.nhtsa.dot.gov/api/home/index/faq), there is no limit to the amount of actions that can be run on the API per day, and during the normal week, they can handle between 1000 – 2000 transactions / minute on the servers.

### Implementation and trade-offs
The APIs don't have a rate limit by definition and don't provide any information in the header about call limits or timeout, however, I had run into some issues getting HTTP 404 error because of the classic N+1 problem.

Some options could be implemented like creating batches, queueing the batches, and retrying in case rate limit is achieved.

For the sake of the exercise, I implemented a simple batch system where I create small batches controlled by constant values, and the database load will take more or less time based on the numbers.

### Requirements
I was able to implement the following requirements
1. A service able to parse the XML (xml-parser service)
2. A parser who is able to get the XML and transform into a nested oject
3. An persistent service who is able to sabe the parsed data into database
4. A GraphQL endpoint which is able to response according to this [specification](https://gist.github.com/mbaigbimm/d340e7800d17737482e71c9ad1856f68)
5. Unit tests to cover both services and data validation
6. The project was done using typescript
7. The framework used was NestJS with TypeORM for database.
8. Teh database is Postgres

# How to run
There's a `.env` file named as `.env-change`. You may need to rename it to `.env` where database configuration is placed.
Whiout this change, the application may not work as expected.

## Docker
To build the images and compile the typescript classes, the following command is required
1. `docker compose up --build`

## NestJS
To build the database tables, you may need to run the command
1. `npm run migration:run`

## GraphQL
The unique point of call is `http://localhost:3000/graphql` and the query available is the following:
```
query VehicleMakes {
    vehicleMakes {
        makeId
        makeName
        vehicleTypes {
            typeId
            typeName
        }
    }
}
```

## Tests
To run the tests, I'm using Jest, which is native on NestJS. The command is
1. `npm run test`

## Commands available
All the commands are available on package.json file as I show here:
```
npm run build
npm run format
npm run start
npm run start:dev
npm run start:debug
npm run start:prod
npm run lint
npm run test
npm run test:watch
npm run test:cov
npm run test:debug
npm run test:e2e
npm run typeorm
npm run typeorm:cli
npm run migration:generate
npm run migration:run
npm run migration:revert
```