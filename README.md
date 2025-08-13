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
sr deploy [resource-name]
sr invoke [resource-name]

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
s resource-name deploy 

# Invoking a function
s resource-name invoke

# Managing instances
s resource-name instance list
s resource-name logs --instance-id xxx
s resource-name instance exec --instance-id xxx -c "sh"

# Multiple steps for template specification
s resource-name deploy -t ./s.yaml
s resource-name invoke -t ./s.yaml
```

### Optimized Usage with Aliyun Serverless Helper
```bash
# Interactive deployment with function selection
sr deploy

# Quick deployment with direct function name
# #IMPORTANCE# Command pattern: sr [ACTION] [OBJECT] - intuitive and consistent syntax
sr deploy resource-name

# Template-aware deployment
sr -t ./templates/s.prod.yaml deploy resource-name

# Simplified instance management
# #IMPORTANCE#  no need to retrieve the instance-id first
sr instance list
sr instance log
sr instance exec

# One-time template specification for multiple commands
sr -t ./templates/s.prod.yaml deploy resource-name
sr -t ./templates/s.prod.yaml invoke resource-name
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
