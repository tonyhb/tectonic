# Change Log
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/) 
and this project adheres to [Semantic Versioning](http://semver.org/).

## [1.1.1] - 2015-09-11
### Fixed
- Ensures queries are cached with `null` response (HTTP 204)

## [1.1.0] - 2015-09-11
### Added
- Ensures deleted models via `deleteModel` mark models as deleted in the
  reducer
- Update getQueryData to respect deleted models and model-specific cache
  expiration.
  Components will now never receive data from deleted or expired models
