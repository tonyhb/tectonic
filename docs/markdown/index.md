## What is Tectonic?

Tectonic is a small library that makes loading REST API data a one-liner within your redux apps.

## Why should I use it?

You'll write 80% less data loading code: no more action, reducer, normalizr, reselect boilerplate.

Tectonic handles all actions, reducer data management, and prop injection for you &emdash; with one line.  Plus you can swap out real data for fake data using a mock driver with one line.

Overall, it's fast to write and maintain, plus it'll save your sanity.

## But I love writing actions, normalizers, reducers, and reselect queries!

Homie, you loco!.  We won't reach out from your monitor and slap you, but if you don't get your data shape right you'll spend a ton of time reworking each reselect query and reducer.  Plus, this takes a *lot of time*.  Don't you get bored?

## What about GraphQL?  I wanna use that.

Love it!  Unfortunately you need a GraphQL endpoint to hit, though, and sometimes that's *just not available*.  In this case Tectonic provides an adapter for you to have declerative data loading over a REST API which will tide you over.

If you can use it you should... relay 2 is looking excellent and Apollo is also very great work.

## How do I get started?

Head over to the SETUP GUIDE to learn how to use it.

## You got one of those example projects?

Knock yourself out!

## How does it work?

Each time you ask for data to be loaded via THE `@load` DECORATOR you create a QUERY.  This query specifies things like whether you're asking for a single item or a list of items, the MODEL that you need loaded, and the parameters you're passing in to load data.

Tectonic then takes each query and passes it to a RESOLVER.   It's the RESOLVER'S job to inspect each query and match it against every SOURCE DEFINITION that you specified, figuring out which API endpoint to hit.  Once the RESOLVER has a valid SOURCE DEFINITION for a QUERY, tectonic invokes the SOURCE DEFINITION to load your data.  The data is then normalized and stored with cache information from the server's response inside tectonic's REDUCER.

Finally, THE `@load` DECORATOR is given the data for each query and passes it down to your component.

This is a pretty basic overview that hides the complexity of the resolver and decorator.  Things like dependent data loading (eg. load user A then once user A's data is loaded use those props to load their list of posts, or N+1 problems) make this more complex.  For more information on how Tectonic works check out the INTERNALS documentation. 

## What are these decorator, models, and sources you mention?

Ah.  Great question.  Kind of key to the whole thing, really.

Head to the getting started guide for an overview, or the INTERNALS guide to read more on each part.

## Why are they called source definitions and not API endpoints?

They don't necessarily have to be an API endpoint.  What if you're using a mock driver, or a localstorage driver?  😇

## Is it ready to use?

A few places are using it in production, working out the kinks and improving the API as we go.  The API *will probably* change as we progress to version 2.0 and there may be bugs.  That said, give it a go and file an issue if you run into anything.

## How does it make AJAX requests?

Requests are invoked via DRIVERS, so it's interchangeable.  Tectonic ships with a SUPERAGENT driver which (as you might expect) uses the awesome SUPERAGENT library to make requests.

## Wait. Tell me more about these drivers!

DRIVERS power the logic behind making each API request.  That means you can do some wonderful things with it, such as wrap a driver with a `LocalStorage` adapter that caches API requests for use offline and provides API responses even if the data connection goes down.

## Can we use websockets?

If you help WRITE A DRIVER for it then yup, sure!

## How do I file an issue?

Head over to GitHub, my friend.  I'll be waiting for you, in a totally non creepy way.
