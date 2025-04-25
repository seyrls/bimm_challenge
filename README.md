```
vehicle-data-service/
├── src/
│   ├── main.ts                  # Application entry point
│   ├── app.module.ts            # Root module
│   ├── config/                  # Configuration files
│   ├── common/                  # Common utilities, interceptors, filters
│   ├── vehicles/                # Vehicles module
│   │   ├── dto/                 # Data Transfer Objects
│   │   ├── entities/            # TypeORM entities
│   │   ├── interfaces/          # TypeScript interfaces
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
└── jest.config.js               # Jest configuration
```
