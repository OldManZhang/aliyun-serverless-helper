# Aliyun Serverless Helper (sr)

An enhanced CLI tool for Aliyun Serverless Devs that provides interactive menus and simplified commands.

## Installation

```bash
# Install globally
npm install -g aliyun-serverless-helper

# Or install from GitHub
npm install -g github:OldManZhang/aliyun-serverless-helper
```

## Features

- Interactive menu for common operations
- Simplified command syntax for Aliyun Function Compute
- Instance management with easy selection
- Support for both FC and FC3 formats
- Optimized for Aliyun Serverless services

## Usage

```bash
# Interactive mode
sr

# With specific template file
sr -t ./path/to/s.yaml

# Direct commands
sr deploy [function-name]
sr invoke [function-name]

# Instance operations
sr instance list
sr instance log
sr instance exec

# Help
sr --help
sr instance --help
```

## Options

- `-t, --template <path>` - Specify the template file path
**- `-c, --config <path>` - Alternative way to specify template file
- `--silent` - Suppress non-essential output
- `-o, --output-format <format>` - Specify output format (default|json|yaml|raw)**

## Requirements

- Node.js 12 or later
- Aliyun Serverless Devs (`@serverless-devs/s`) installed globally
- Valid Aliyun credentials configured

## License

MIT
