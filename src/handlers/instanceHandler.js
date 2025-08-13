const inquirer = require('inquirer');
const { readResourceConfig } = require('../config');
const { executeCommand, getInstanceIds, selectResource } = require('../utils');

// Function to handle instance list
async function handleInstanceList(options) {
  // Get the config path, prioritizing template option over config option
  const yamlPath = options.template || options.config || './s.yaml';
  
  // Add debug logs
  // console.log('Debug - Options:', JSON.stringify(options));
  // console.log('Debug - YAML path:', yamlPath);
  
  const resourcesList = readResourceConfig(yamlPath, options);
  
  // Prompt for resource selection using selectResource function
  const resourceName = await selectResource(resourcesList, 'Select a resource to list instances:');
  
  // Include the s.yaml path in the command using s's -t flag
  const templateOption = yamlPath !== './s.yaml' ? `-t ${yamlPath}` : '';
  
  // console.log('Debug - Template option:', templateOption);
  
  const command = `s ${templateOption} ${resourceName} instance list`.trim();
  
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

// Function to handle instance log
async function handleInstanceLog(instanceId, options) {
  const yamlPath = options.template || options.config || './s.yaml';
  const resourcesList = readResourceConfig(yamlPath, options);
  
  let resourceName;
  if (!options.resource) {
    // Prompt for resource selection if not provided using selectResource function
    resourceName = await selectResource(resourcesList, 'Select a resource:');
  } else {
    resourceName = options.resource;
    if (!resourcesList.includes(resourceName)) {
      console.error(`Error: Resource "${resourceName}" not found in ${yamlPath}`);
      process.exit(1);
    }
  }
  
  // If instanceId is not provided, fetch and ask for it
  if (!instanceId) {
    const instances = await getInstanceIds(resourceName, options);
    
    if (instances.length === 0) {
      console.log('No instances available. Please deploy and invoke the resource first.');
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
  const command = `s ${templateOption} ${resourceName} logs --tail --instance-id ${instanceId}`.trim();
  
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
  const resourcesList = readResourceConfig(yamlPath, options);
  
  let resourceName;
  if (!options.resource) {
    // Prompt for resource selection if not provided using selectResource function
    resourceName = await selectResource(resourcesList, 'Select a resource:');
  } else {
    resourceName = options.resource;
    if (!resourcesList.includes(resourceName)) {
      console.error(`Error: Resource "${resourceName}" not found in ${yamlPath}`);
      process.exit(1);
    }
  }
  
  // If instanceId is not provided, fetch and ask for it
  if (!instanceId) {
    const instances = await getInstanceIds(resourceName, options);
    
    if (instances.length === 0) {
      console.log('No instances available. Please deploy and invoke the resource first.');
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
  const command = `s ${templateOption} ${resourceName} instance exec --instance-id ${instanceId} -c "${commandAnswer.command}"`.trim();
  
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

module.exports = {
  handleInstanceList,
  handleInstanceLog,
  handleInstanceExec,
  handleInstanceInteractive
};