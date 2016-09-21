# Change Log
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/) 
and this project adheres to [Semantic Versioning](http://semver.org/).

## [1.1.6] - 2016-09-21
### Changed
- Always re-request GET queries with ERROR cache status
- Never re-request queries with ERROR status set internally; these queries were
  pre-existing from an existing component's render

## [1.1.5]
### Fixed
- Ensure DELETE queries have their status set to SUCCESS in reducer for
  repeatable queries

## [1.1.4] - 2016-09-19
### Fixed
- Broken release! Apologies.

## [1.1.3] - 2016-09-19
### Added
- Added `getModel` to wrapped component for manually fetching

## [1.1.2] - 2016-09-14
### Added
- Added support for submodels inside tectonic models

## [1.1.1] - 2016-09-11
### Fixed
- Ensures queries are cached with `null` response (HTTP 204)

## [1.1.0] - 2016-09-11
### Added
- Ensures deleted models via `deleteModel` mark models as deleted in the
  reducer
- Update getQueryData to respect deleted models and model-specific cache
  expiration.
  Components will now never receive data from deleted or expired models
