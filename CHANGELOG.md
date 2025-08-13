# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2025-08-13

### Fixed
- Resolved ESM/CommonJS compatibility issues with inquirer-autocomplete-prompt
- Downgraded inquirer-autocomplete-prompt to v2.0.0 for better compatibility
- Removed Babel dependencies that were causing conflicts

## [1.0.9] - 2025-08-13

### Added
- Enhanced resource selection with sorting and fuzzy search capabilities
- Support for keyboard-based resource selection with highlighted matching characters
- New `selectResource` utility function for consistent resource selection across all commands

### Changed
- Updated `deployHandler.js` to use enhanced resource selection
- Updated `invokeHandler.js` to use enhanced resource selection
- Updated `instanceHandler.js` to use enhanced resource selection
- Updated test files to accommodate changes in resource selection logic

### Dependencies
- Added `fuzzy: ^0.1.3` for fuzzy search functionality
- Added `inquirer-autocomplete-prompt: ^2.0.0` for enhanced interactive prompts

## [1.0.0] - 2025-08-13

### Added
- Initial release of Aliyun Serverless Helper (sr)
- Support for `sr` interactive mode
- Support for `sr deploy [resource-name]` command
- Support for `sr invoke [resource-name]` command
- Support for `sr instance` subcommands (list, log, exec)
- Configuration file parsing for both FC and FC3 formats
- Comprehensive test suite with unit tests and fixtures