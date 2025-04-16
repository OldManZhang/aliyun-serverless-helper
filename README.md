# Aliyun Serverless Helper (sr)

An enhanced CLI tool for Aliyun Serverless Devs that provides interactive menus and simplified commands.

Main optimize:
* Interactive menu for common operations
* reduce command input
* Simplified command syntax for better usability


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
- Support for FC3 formats (not test in FC2 yet, please change to FC3 first)
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

## Usage Comparison

### Old Usage Patterns
```bash
# Deploying a function
s deploy function-name

# Invoking a function
s invoke function-name

# Managing instances
s function-name instance list
s function-name logs --instance-id xxx
s function-name instance exec --instance-id xxx -c "sh"

# Multiple steps for template specification
s -t ./s.yaml deploy function-name
s -t ./s.yaml invoke function-name
```

### Optimized Usage with Aliyun Serverless Helper
```bash
# Interactive deployment with function selection
sr deploy

# Quick deployment with direct function name
# #IMPORTANCE# Command pattern: sr [ACTION] [OBJECT] - intuitive and consistent syntax
sr deploy function-name

# Template-aware deployment
sr -t ./templates/s.prod.yaml deploy function-name

# Simplified instance management
# #IMPORTANCE#  no need to retrieve the instance-id first
sr instance list
sr instance log
sr instance exec

# One-time template specification for multiple commands
sr -t ./templates/s.prod.yaml deploy function-name
sr -t ./templates/s.prod.yaml invoke function-name
```

### Key Improvements
1. **Simplified Commands**
   - Reduced command length
   - More intuitive syntax
   - Interactive mode for better UX

2. **Template Management**
   - Consistent template handling
   - Environment-specific configurations
   - Reduced repetition

3. **Instance Operations**
   - Unified instance commands
   - Interactive instance selection
   - Streamlined logging and execution

4. **Error Prevention**
   - Built-in confirmation prompts
   - Function name validation
   - Template file verification

## Requirements

- Node.js 12 or later
- Aliyun Serverless Devs (`@serverless-devs/s`) installed globally
- Valid Aliyun credentials configured

## Contributing

We welcome your feature requests and suggestions through GitHub:

1. **Submit an Issue**
   - Visit [GitHub Issues](https://github.com/OldManZhang/aliyun-serverless-helper/issues)
   - Click the "New Issue" button
   - Choose the issue type (feature request, bug report, etc.)
   - Provide a detailed description of your request or issue

2. **Feature Requests**
   - Describe your desired feature in detail
   - Provide use cases and expected outcomes
   - Include references to similar features if available

3. **Bug Reports**
   - Provide steps to reproduce the issue
   - Include relevant error messages or logs
   - Specify your environment (OS, Node.js version, etc.)

## License

MIT
