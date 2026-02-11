# Defining Relationships in Harper

Harper allows you to define relationships between tables using the `@relationship` directive in your GraphQL schema. This enables powerful features like automatic joins when querying through REST APIs.

## The `@relationship` Directive

The `@relationship` directive is applied to a field in your GraphQL type and takes two optional arguments:

- `from`: The field in the _current_ table that holds the foreign key.
- `to`: The field in the _related_ table that holds the foreign key.

## Relationship Types

### One-to-One and Many-to-One

To define a relationship where the current table holds the foreign key, use the `from` argument.

```graphql
type Author @table @export {
	id: ID @primaryKey
	name: String
}

type Book @table @export {
	id: ID @primaryKey
	title: String
	authorId: ID
	# This field resolves to an Author object using authorId
	author: Author @relationship(from: "authorId")
}
```

### One-to-Many and Many-to-Many

To define a relationship where the _related_ table holds the foreign key, use the `to` argument. The field type should be an array.

```graphql
type Author @table @export {
	id: ID @primaryKey
	name: String
	# This field resolves to an array of Books that have this author's ID in their authorId field
	books: [Book] @relationship(to: "authorId")
}

type Book @table @export {
	id: ID @primaryKey
	title: String
	authorId: ID
}
```

## Querying Relationships

Once relationships are defined, you can use them in your REST API queries using dot syntax.

Example:
`GET /Book/?author.name=Harper`

This will automatically perform a join and return all books whose author's name is "Harper".

You can also use the `select()` operator to include related data in the response:

`GET /Author/?select(name,books(title))`

This returns authors with their names and a list of their books (only the titles).

## Benefits of `@relationship`

- **Simplified Queries**: No need for complex manual joins in your code.
- **Efficient Data Fetching**: Harper optimizes relationship lookups.
- **Improved API Discoverability**: Related data structures are clearly defined in your schema.
