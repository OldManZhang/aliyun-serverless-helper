#!/usr/bin/env node

const { program } = require('commander');
const inquirer = require('inquirer');
const { execSync } = require('child_process');
const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');

// Function to read s.yaml file
function readServiceConfig(yamlPath = './s.yaml') {
  try {
    const fileContents = fs.readFileSync(yamlPath, 'utf8');
    const config = yaml.load(fileContents);
    
    // Extract function names from either services (FC) or resources (FC3) section
    const functions = [];
    
    if (config.services) {
      // FC format
      for (const [serviceName, serviceConfig] of Object.entries(config.services)) {
        functions.push(serviceName);
      }
    }
    
    if (config.resources) {
      // FC3 format
      for (const [resourceName, resourceConfig] of Object.entries(config.resources)) {
        functions.push(resourceName);
      }
    }
    
    if (functions.length === 0) {
      console.warn('No functions found in s.yaml file. Make sure the file contains either services or resources section.');
    }
    
    return functions;
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error(`Error: s.yaml file not found at ${yamlPath}`);
    } else {
      console.error('Error reading s.yaml:', error.message);
    }
    process.exit(1);
  }
}

// Function to handle deploy action
async function handleDeploy(functionName, options) {
  // Get the config path, prioritizing template option over config option
  const yamlPath = options.template || options.config || './s.yaml';
  const functionsList = readServiceConfig(yamlPath);

  if (!functionName) {
    const answer = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedFunction',
        message: 'Select a function to deploy:',
        choices: functionsList
      }
    ]);
    functionName = answer.selectedFunction;
  } else if (!functionsList.includes(functionName)) {
    console.error(`Error: Function "${functionName}" not found in ${yamlPath}`);
    process.exit(1);
  }

  // Include the s.yaml path in the command using s's -t flag
  const templateOption = yamlPath !== './s.yaml' ? `-t ${yamlPath}` : '';
  const command = `s ${templateOption} ${functionName} deploy`.trim();
  
  // Show the command and ask for confirmation
  const confirmation = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'proceed',
      message: `About to execute: "${command}". Proceed?`,
      default: true
    }
  ]);

  if (confirmation.proceed) {
    executeCommand(command, options);
  } else {
    console.log('Command cancelled.');
  }
}

// Function to handle invoke action
async function handleInvoke(functionName, options) {
  // Get the config path, prioritizing template option over config option
  const yamlPath = options.template || options.config || './s.yaml';
  const functionsList = readServiceConfig(yamlPath);

  if (!functionName) {
    const answer = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedFunction',
        message: 'Select a function to invoke:',
        choices: functionsList
      }
    ]);
    functionName = answer.selectedFunction;
  } else if (!functionsList.includes(functionName)) {
    console.error(`Error: Function "${functionName}" not found in ${yamlPath}`);
    process.exit(1);
  }

  // Include the s.yaml path in the command using s's -t flag
  const templateOption = yamlPath !== './s.yaml' ? `-t ${yamlPath}` : '';
  const command = `s ${templateOption} ${functionName} invoke`.trim();
  
  // Show the command and ask for confirmation
  const confirmation = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'proceed',
      message: `About to execute: "${command}". Proceed?`,
      default: true
    }
  ]);

  if (confirmation.proceed) {
    executeCommand(command, options);
  } else {
    console.log('Command cancelled.');
  }
}

// Function to handle instance list
async function handleInstanceList(options) {
  // Get the config path, prioritizing template option over config option
  const yamlPath = options.template || options.config || './s.yaml';
  
  // Add debug logs
  console.log('Debug - Options:', JSON.stringify(options));
  console.log('Debug - YAML path:', yamlPath);
  
  const functionsList = readServiceConfig(yamlPath);
  
  // Prompt for function selection
  const answer = await inquirer.prompt([
    {
      type: 'list',
      name: 'selectedFunction',
      message: 'Select a function to list instances:',
      choices: functionsList
    }
  ]);
  
  const functionName = answer.selectedFunction;
  
  // Include the s.yaml path in the command using s's -t flag
  const templateOption = yamlPath !== './s.yaml' ? `-t ${yamlPath}` : '';
  
  console.log('Debug - Template option:', templateOption);
  
  const command = `s ${templateOption} ${functionName} instance list`.trim();
  
  // Show the command and ask for confirmation
  const confirmation = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'proceed',
      message: `About to execute: "${command}". Proceed?`,
      default: true
    }
  ]);

  if (confirmation.proceed) {
    executeCommand(command, options);
  } else {
    console.log('Command cancelled.');
  }
}

// Function to get instance IDs for a function
async function getInstanceIds(functionName, options) {
  if (!functionName) {
    console.error('Error: Function name is required');
    return [];
  }

  const yamlPath = options.template || options.config || './s.yaml';
  
  // Include the s.yaml path in the command using s's -t flag
  const templateOption = yamlPath !== './s.yaml' ? `-t ${yamlPath}` : '';
  
  // Always use --silent when fetching instance IDs
  // Always use -o json to get JSON formatted output
  const command = `s ${templateOption} ${functionName} instance list --silent -o json`.trim();
  
  try {
    console.log(`Fetching instances for ${functionName}...`);
    console.log(`Debug - Command: ${command}`);
    
    const result = execSync(command, { encoding: 'utf-8' });
    
    if (!result || result.trim() === '') {
      console.log(`No instances found for ${functionName}`);
      return [];
    }
    
    console.log('Debug - Raw result:', result);
    
    try {
      // Parse the JSON result
      const data = JSON.parse(result);
      
      // Check if instances are nested under "instances" key
      const instances = data.instances || data;
      
      if (!instances || !instances.length) {
        console.log(`No instances found for ${functionName}`);
        return [];
      }
      
      // Extract instance IDs and add more information
      return instances.map(instance => {
        // Extract date info if available (from createdTimeMs)
        const dateInfo = instance.createdTimeMs ? 
          `(created: ${new Date(instance.createdTimeMs).toLocaleString()})` : '';
          
        // Use instanceId as the primary identifier
        const label = `${instance.instanceId} ${dateInfo}`.trim();
        
        return {
          name: label,
          value: instance.instanceId
        };
      });
    } catch (jsonError) {
      console.error('Debug - JSON parse error:', jsonError.message);
      console.error('Debug - JSON content:', result);
      
      // Fallback: parse the output as text
      const lines = result.split('\n');
      const instances = [];
      
      // Simple parsing of the text output to extract instance IDs
      for (const line of lines) {
        const trimmedLine = line.trim();
        // Look for lines that might contain instance IDs
        if (trimmedLine && (trimmedLine.includes('c-') || trimmedLine.includes('i-')) && !trimmedLine.startsWith('#')) {
          // Support both FC and FC3 instance ID formats
          const parts = trimmedLine.split(/\s+/);
          const instanceId = parts.find(part => part.startsWith('c-') || part.startsWith('i-')) || parts[0];
          instances.push({
            name: instanceId,
            value: instanceId
          });
        }
      }
      
      if (instances.length === 0) {
        console.log(`No instances found for ${functionName}`);
      }
      
      return instances;
    }
  } catch (error) {
    console.error('Failed to fetch instances:', error.message);
    if (error.stderr) {
      console.error('Error details:', error.stderr.toString());
    }
    return [];
  }
}

// Update all command execution functions to support silent mode
function executeCommand(command, options) {
  try {
    console.log(`Executing: ${command}`);
    
    // Add silent and output format flags if specified
    const fullCommand = `${command}`.trim();
    
    execSync(fullCommand, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error('Command failed:', error.message);
    return false;
  }
}

// Function to handle instance log
async function handleInstanceLog(instanceId, options) {
  const yamlPath = options.template || options.config || './s.yaml';
  const functionsList = readServiceConfig(yamlPath);
  
  let functionName;
  if (!options.function) {
    // Prompt for function selection if not provided
    const functionAnswer = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedFunction',
        message: 'Select a function:',
        choices: functionsList
      }
    ]);
    functionName = functionAnswer.selectedFunction;
  } else {
    functionName = options.function;
    if (!functionsList.includes(functionName)) {
      console.error(`Error: Function "${functionName}" not found in ${yamlPath}`);
      process.exit(1);
    }
  }
  
  // If instanceId is not provided, fetch and ask for it
  if (!instanceId) {
    const instances = await getInstanceIds(functionName, options);
    
    if (instances.length === 0) {
      console.log('No instances available. Please deploy and invoke the function first.');
      return;
    }
    
    const instanceAnswer = await inquirer.prompt([
      {
        type: 'list',
        name: 'instanceId',
        message: 'Select an instance:',
        choices: instances
      }
    ]);
    instanceId = instanceAnswer.instanceId;
  }
  
  // Include the s.yaml path in the command using s's -t flag
  const templateOption = yamlPath !== './s.yaml' ? `-t ${yamlPath}` : '';
  const command = `s ${templateOption} ${functionName} logs --tail --instance-id ${instanceId}`.trim();
  
  // Show the command and ask for confirmation
  const confirmation = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'proceed',
      message: `About to execute: "${command}". Proceed?`,
      default: true
    }
  ]);

  if (confirmation.proceed) {
    executeCommand(command, options);
  } else {
    console.log('Command cancelled.');
  }
}

// Function to handle instance exec
async function handleInstanceExec(instanceId, options) {
  const yamlPath = options.template || options.config || './s.yaml';
  const functionsList = readServiceConfig(yamlPath);
  
  let functionName;
  if (!options.function) {
    // Prompt for function selection if not provided
    const functionAnswer = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedFunction',
        message: 'Select a function:',
        choices: functionsList
      }
    ]);
    functionName = functionAnswer.selectedFunction;
  } else {
    functionName = options.function;
    if (!functionsList.includes(functionName)) {
      console.error(`Error: Function "${functionName}" not found in ${yamlPath}`);
      process.exit(1);
    }
  }
  
  // If instanceId is not provided, fetch and ask for it
  if (!instanceId) {
    const instances = await getInstanceIds(functionName, options);
    
    if (instances.length === 0) {
      console.log('No instances available. Please deploy and invoke the function first.');
      return;
    }
    
    const instanceAnswer = await inquirer.prompt([
      {
        type: 'list',
        name: 'instanceId',
        message: 'Select an instance:',
        choices: instances
      }
    ]);
    instanceId = instanceAnswer.instanceId;
  }
  
  // Ask for command to execute with "sh" as default
  const commandAnswer = await inquirer.prompt([
    {
      type: 'input',
      name: 'command',
      message: 'Enter command to execute on instance:',
      default: 'sh',  // Set default value to "sh"
      validate: (input) => input.trim() !== '' ? true : 'Command is required'
    }
  ]);
  
  // Include the s.yaml path in the command using s's -t flag
  const templateOption = yamlPath !== './s.yaml' ? `-t ${yamlPath}` : '';
  const command = `s ${templateOption} ${functionName} instance exec --instance-id ${instanceId} -c "${commandAnswer.command}"`.trim();
  
  // Show the command and ask for confirmation
  const confirmation = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'proceed',
      message: `About to execute: "${command}". Proceed?`,
      default: true
    }
  ]);

  if (confirmation.proceed) {
    executeCommand(command, options);
  } else {
    console.log('Command cancelled.');
  }
}

// Update the handleInteractive function to include instance operations
async function handleInteractive(options) {
  // Get the config path, prioritizing template option over config option
  const yamlPath = options.template || options.config || './s.yaml';
  const functionsList = readServiceConfig(yamlPath);

  const answer = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'Select an action:',
      choices: ['deploy', 'invoke', 'instance']
    }
  ]);

  if (answer.action === 'instance') {
    // If instance is selected, prompt for the instance subcommand
    const instanceAnswer = await inquirer.prompt([
      {
        type: 'list',
        name: 'subcommand',
        message: 'Select instance operation:',
        choices: ['list', 'log', 'exec']
      }
    ]);

    if (instanceAnswer.subcommand === 'list') {
      await handleInstanceList(options);
    } else if (instanceAnswer.subcommand === 'log') {
      await handleInstanceLog(null, options);
    } else if (instanceAnswer.subcommand === 'exec') {
      await handleInstanceExec(null, options);
    }
  } else {
    // For non-instance actions, prompt for function selection
    const functionAnswer = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedFunction',
        message: 'Select a function:',
        choices: functionsList
      }
    ]);

    if (answer.action === 'deploy') {
      await handleDeploy(functionAnswer.selectedFunction, options);
    } else if (answer.action === 'invoke') {
      await handleInvoke(functionAnswer.selectedFunction, options);
    }
  }
}

// Main program
program
  .name('sr')
  .description('Enhanced CLI for Serverless Devs')
  .version(require('../package.json').version)
  .option('-t, --template <path>', 'Specify the template file (same as -c)', './s.yaml');

// Add command validation
program.on('command:*', (operands) => {
  const [command] = operands;
  const validCommands = ['deploy', 'invoke', 'instance'];
  const validInstanceCommands = ['list', 'log', 'exec'];
  
  // Check if it's a misspelled main command
  if (!validCommands.includes(command)) {
    console.error(`Error: Unknown command '${command}'`);
    console.log(`Did you mean one of these?`);
    validCommands.forEach(cmd => console.log(`  ${cmd}`));
    process.exit(1);
  }
  
  // Check if it's a misspelled instance subcommand
  if (command === 'instance' && operands.length > 1) {
    const subcommand = operands[1];
    if (!validInstanceCommands.includes(subcommand)) {
      console.error(`Error: Unknown instance subcommand '${subcommand}'`);
      console.log(`Did you mean one of these?`);
      validInstanceCommands.forEach(cmd => console.log(`  ${cmd}`));
      process.exit(1);
    }
  }
});

program
  .command('deploy [functionName]')
  .description('Deploy a function')
  .action((functionName, cmdObj) => {
    // Get options from the root program
    const options = program.opts();
    handleDeploy(functionName, options);
  });

// Add the invoke command
program
  .command('invoke [functionName]')
  .description('Invoke a function')
  .action((functionName, cmdObj) => {
    // Get options from the root program
    const options = program.opts();
    handleInvoke(functionName, options);
  });

// After existing commands, add instance command with subcommands
const instanceCommand = program
  .command('instance')
  .description('Instance operations')
  .action((cmdObj) => {
    // Get options from the root program
    const options = program.opts();
    handleInstanceInteractive(options);
  });

// Add a new function to handle interactive instance operations
async function handleInstanceInteractive(options) {
  const answer = await inquirer.prompt([
    {
      type: 'list',
      name: 'subcommand',
      message: 'Select instance operation:',
      choices: ['list', 'log', 'exec']
    }
  ]);

  if (answer.subcommand === 'list') {
    await handleInstanceList(options);
  } else if (answer.subcommand === 'log') {
    await handleInstanceLog(null, options);
  } else if (answer.subcommand === 'exec') {
    await handleInstanceExec(null, options);
  }
}

instanceCommand
  .command('list')
  .description('List function instances')
  .action((cmdObj) => {
    // Get options from the root program
    const options = program.opts();
    handleInstanceList(options);
  });

instanceCommand
  .command('log <instanceId>')
  .description('View instance logs')
  .option('-f, --function <name>', 'Specify function name')
  .action((instanceId, cmdObj) => {
    // Get options from the root program
    const options = { ...program.opts(), function: cmdObj.function };
    handleInstanceLog(instanceId, options);
  });

instanceCommand
  .command('exec <instanceId>')
  .description('Execute command on instance')
  .option('-f, --function <name>', 'Specify function name')
  .action((instanceId, cmdObj) => {
    // Get options from the root program
    const options = { ...program.opts(), function: cmdObj.function };
    handleInstanceExec(instanceId, options);
  });

// Add this to handle the case when no command is given, just options
program
  .action(() => {
    // Check if command was provided but is invalid
    const args = process.argv.slice(2);
    if (args.length > 0 && !args[0].startsWith('-')) {
      const command = args[0];
      const validCommands = ['deploy', 'invoke', 'instance'];
      
      if (!validCommands.includes(command)) {
        console.error(`Error: Unknown command '${command}'`);
        console.log(`Did you mean one of these?`);
        validCommands.forEach(cmd => console.log(`  ${cmd}`));
        process.exit(1);
      }
    }
    
    // This will only run if no specific command was matched or only options were provided
    handleInteractive(program.opts());
  });

program.parse(process.argv); 