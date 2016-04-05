- Figure out how to tell if a query uses IDs and query cache pre-emptively

- Relationships: define relationships between models such that queries and
  source definitions are defined with the model relationship (ie
  User.Posts.getList() returns Post.list() and only looks in sourcedefinitions
  where the source provides User.Posts).

- Data updating: figure out how to update and create new models from a component
  (idea: pass a function down via @load that accepts arbitrary model instances
  for creating/updating. how do we define sources for this?)
