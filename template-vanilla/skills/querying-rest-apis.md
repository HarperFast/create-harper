# Querying through REST APIs in Harper

Harper's automatic REST APIs support powerful querying capabilities directly through URL query parameters. This allows you to filter, sort, paginate, and join data without writing complex queries.

## Basic Filtering

The simplest way to filter is by using attribute names as query parameters:

`GET /ExamplePeople/?tag=friend`

This returns all records where `tag` equals `friend`.

## Comparison Operators (FIQL-style)

You can use standard comparison operators by appending them to the attribute name with an `=` sign:

- `gt`: Greater than
- `ge`: Greater than or equal to
- `lt`: Less than
- `le`: Less than or equal to
- `ne`: Not equal

Example:
`GET /Products/?price=gt=100&price=lt=200`

## Logic Operators

- **AND**: Use the `&` operator (default).
- **OR**: Use the `|` operator.

Example:
`GET /Products/?rating=5|featured=true`

## Grouping

Use parentheses `()` to group conditions and indicate order of operations.

Example:
`GET /Products/?(rating=5|featured=true)&price=lt=50`

## Selection

Use `select()` to limit the returned fields:

`GET /Products/?select(name,price)`

## Pagination

Use `limit(start, end)` or `limit(end)`:

- `limit(10)`: Returns the first 10 records.
- `limit(20, 10)`: Skips the first 20 records and returns the next 10.

Example:
`GET /Products/?limit(0,20)`

## Sorting

Use `sort()` with `+` (ascending) or `-` (descending) prefixes:

`GET /Products/?sort(+price,-rating)`

## Joins and Chained Attributes

If you have defined relationships in your schema using the `@relationship` directive, you can use dot syntax to query across tables. For more on defining these, see the [Defining Relationships](defining-relationships.md) skill.

`GET /Book/?author.name=Harper`

This will perform an automatic join and filter books based on the related author's name.
