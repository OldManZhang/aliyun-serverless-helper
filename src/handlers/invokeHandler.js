const inquirer = require('inquirer');
const { readResourceConfig } = require('../config');
const { executeCommand, selectResource } = require('../utils');

// Function to handle invoke action
async function handleInvoke(resourceName, options) {
  // Get the config path, prioritizing template option over config option
  const yamlPath = options.template || options.config || './s.yaml';
  const resourcesList = readResourceConfig(yamlPath, options);

  if (!resourceName) {
    resourceName = await selectResource(resourcesList, 'Select a resource to invoke:');
  } else if (!resourcesList.includes(resourceName)) {
    console.error(`Error: Resource "${resourceName}" not found in ${yamlPath}`);
    process.exit(1);
  }

  // Include the s.yaml path in the command using s's -t flag
  const templateOption = yamlPath !== './s.yaml' ? `-t ${yamlPath}` : '';
  const command = `s ${templateOption} ${resourceName} invoke`.trim();
  
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

module.exports = { handleInvoke };